import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import type {
  SessionUser,
  Role,
  Permission,
  AuthorizationResult,
  AuthCheckOptions,
  AuthRequirement,
} from "./types";
import { getRolePermissions, canManageRole } from "./constants";

/**
 * Convert database municipality to session user
 */
export function toSessionUser(municipality: {
  id: string;
  name: string;
  username: string;
  role: string;
  region: string;
  passwordHash: string;
  assignedRegions?: string[] | null;
  permissionsOverride?: string[] | null;
  createdAt: Date;
}): SessionUser {
  return {
    id: municipality.id,
    name: municipality.name,
    username: municipality.username,
    role: municipality.role as Role,
    region: municipality.region,
    assignedRegions: municipality.assignedRegions ?? undefined,
    permissionsOverride: municipality.permissionsOverride 
      ? (municipality.permissionsOverride as Permission[])
      : undefined,
  };
}

/**
 * Check if user has a specific role
 */
export function hasRole(session: SessionUser, role: Role | Role[]): boolean {
  if (session.role === "superadmin") return true;

  if (Array.isArray(role)) {
    return role.includes(session.role);
  }
  return session.role === role;
}

/**
 * Check if user has a specific permission
 * Supports permission overrides from user record
 */
export function hasPermission(
  session: SessionUser,
  permission: Permission | Permission[],
  requireAll: boolean = false
): boolean {
  // Superadmin bypass
  if (session.role === "superadmin") return true;

  // Check permission overrides first
  const userPermissions = session.permissionsOverride ?? getRolePermissions(session.role);

  if (Array.isArray(permission)) {
    if (requireAll) {
      return permission.every((p) => userPermissions.includes(p));
    }
    return permission.some((p) => userPermissions.includes(p));
  }

  return userPermissions.includes(permission);
}

/**
 * Check if user has access to a specific region
 * Supports single region, multiple assigned regions, or region arrays
 */
export function hasRegionAccess(
  session: SessionUser,
  region: string | string[]
): boolean {
  // Superadmin can access all regions
  if (session.role === "superadmin") return true;

  const regionsToCheck = Array.isArray(region) ? region : [region];

  // Regional admin with multiple assigned regions
  if (session.assignedRegions && session.assignedRegions.length > 0) {
    return regionsToCheck.every((r) =>
      session.assignedRegions?.includes(r)
    );
  }

  // Single region role (municipality, moderator, viewer)
  return regionsToCheck.every((r) => r === session.region);
}

/**
 * Main authorization check function
 * Combines role, permission, and region checks
 */
export async function checkAuthorization(
  options: AuthCheckOptions
): Promise<AuthorizationResult> {
  const session = await getSession();

  if (!session) {
    return {
      authorized: false,
      error: {
        code: "UNAUTHORIZED",
        message: "You must be logged in to perform this action",
      },
    };
  }

  const sessionUser = toSessionUser(session);

  // Check roles
  if (options.roles && options.roles.length > 0) {
    const hasRequiredRole = hasRole(sessionUser, options.roles);
    if (!hasRequiredRole && !options.allowSuperadminBypass) {
      return {
        authorized: false,
        error: {
          code: "FORBIDDEN",
          message: `This action requires one of the following roles: ${options.roles.join(", ")}`,
        },
        session: sessionUser,
      };
    }
  }

  // Check permissions
  if (options.permissions && options.permissions.length > 0) {
    const hasRequiredPermission = hasPermission(
      sessionUser,
      options.permissions,
      options.requireAll
    );
    if (!hasRequiredPermission && !options.allowSuperadminBypass) {
      return {
        authorized: false,
        error: {
          code: "FORBIDDEN",
          message: `You don't have permission to perform this action`,
        },
        session: sessionUser,
      };
    }
  }

  // Check region access
  if (options.regionCheck) {
    let regions: string | string[];

    if (typeof options.regionCheck === "string") {
      regions = options.regionCheck;
    } else if (Array.isArray(options.regionCheck)) {
      regions = options.regionCheck;
    } else {
      // regionCheck is true, will need to be checked later with context
      return {
        authorized: true,
        session: sessionUser,
      };
    }

    const hasAccess = hasRegionAccess(sessionUser, regions);
    if (!hasAccess) {
      return {
        authorized: false,
        error: {
          code: "FORBIDDEN_REGION",
          message: "You don't have access to this region",
        },
        session: sessionUser,
      };
    }
  }

  return {
    authorized: true,
    session: sessionUser,
  };
}

/**
 * Require authentication (any logged-in user)
 * Returns session or error response
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ session: SessionUser } | NextResponse> {
  const result = await checkAuthorization({});

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error?.message || "Unauthorized" },
      { status: 401 }
    );
  }

  return { session: result.session! };
}

/**
 * Require specific permission(s)
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission | Permission[],
  options: { requireAll?: boolean } = {}
): Promise<{ session: SessionUser } | NextResponse> {
  const permissions = Array.isArray(permission) ? permission : [permission];

  const result = await checkAuthorization({
    permissions,
    requireAll: options.requireAll,
  });

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error?.message || "Forbidden" },
      { status: 403 }
    );
  }

  return { session: result.session! };
}

/**
 * Require specific role(s)
 */
export async function requireRole(
  request: NextRequest,
  role: Role | Role[]
): Promise<{ session: SessionUser } | NextResponse> {
  const roles = Array.isArray(role) ? role : [role];

  const result = await checkAuthorization({
    roles,
  });

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error?.message || "Forbidden" },
      { status: 403 }
    );
  }

  return { session: result.session! };
}

/**
 * Require region access
 */
export async function requireRegionAccess(
  request: NextRequest,
  region: string | string[]
): Promise<{ session: SessionUser } | NextResponse> {
  const result = await checkAuthorization({
    regionCheck: region,
  });

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error?.message || "Access to this region is forbidden" },
      { status: 403 }
    );
  }

  return { session: result.session! };
}

/**
 * Check if current user can manage target user's role
 */
export function canManageTargetRole(
  managerSession: SessionUser,
  targetRole: Role
): boolean {
  if (managerSession.role === "superadmin") return true;
  return canManageRole(managerSession.role, targetRole);
}

/**
 * Build authorization requirements from options
 * Useful for combining multiple checks
 */
export function buildRequirements(
  ...requirements: AuthRequirement[]
): AuthRequirement[] {
  return requirements;
}

/**
 * Execute authorization check from requirements array
 */
export async function checkRequirements(
  session: SessionUser,
  requirements: AuthRequirement[]
): Promise<{ success: true } | { success: false; error: string }> {
  for (const req of requirements) {
    switch (req.type) {
      case "role":
        if (!hasRole(session, req.value)) {
          const roles = Array.isArray(req.value) ? req.value.join(", ") : req.value;
          return {
            success: false,
            error: `Requires role: ${roles}`,
          };
        }
        break;

      case "permission":
        if (!hasPermission(session, req.value, req.requireAll)) {
          return {
            success: false,
            error: "Insufficient permissions",
          };
        }
        break;

      case "region":
        if (!hasRegionAccess(session, req.value)) {
          return {
            success: false,
            error: "Access to this region is forbidden",
          };
        }
        break;

      case "custom":
        const result = await req.check(session);
        if (!result) {
          return {
            success: false,
            error: "Custom authorization check failed",
          };
        }
        break;
    }
  }

  return { success: true };
}

/**
 * Create a NextResponse for authorization errors
 */
export function createAuthErrorResponse(
  error: { code: string; message: string },
  status: number = 403
): NextResponse {
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
    },
    { status }
  );
}

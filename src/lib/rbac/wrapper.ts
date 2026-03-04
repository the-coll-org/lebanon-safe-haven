import { NextRequest, NextResponse } from "next/server";
import { validateOrigin } from "@/lib/csrf";
import { checkAuthorization, toSessionUser } from "./helpers";
import { createPermissionDenialLog } from "./audit";
import type { SessionUser, Role, Permission } from "./types";

/**
 * Options for the withAuth wrapper
 */
export interface WithAuthOptions {
  /**
   * Required roles (user must have one of these)
   */
  roles?: Role | Role[];
  
  /**
   * Required permissions (user must have one of these, or all if requireAll is true)
   */
  permissions?: Permission | Permission[];
  
  /**
   * Require all permissions instead of just one
   */
  requireAll?: boolean;
  
  /**
   * Validate CSRF origin before authorization check
   */
  csrf?: boolean;
  
  /**
   * Check region access - can be:
   * - true: requires region check but region comes from context
   * - string: specific region to check
   * - string[]: array of regions to check
   * - function: dynamic region extraction from request
   */
  regionCheck?:
    | boolean
    | string
    | string[]
    | ((request: NextRequest, context: { params?: Promise<Record<string, string>> }) => string | string[] | Promise<string | string[]>);
  
  /**
   * Allow superadmin to bypass all checks
   * @default true
   */
  allowSuperadminBypass?: boolean;
  
  /**
   * Log permission denials for audit
   * @default true
   */
  logDenials?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: { code: string; message: string }) => NextResponse;
}

/**
 * Context passed to the handler
 */
export interface AuthHandlerContext {
  session: SessionUser;
  params?: Promise<Record<string, string>>;
}

/**
 * Handler function type
 */
export type AuthHandler = (
  request: NextRequest,
  context: AuthHandlerContext
) => Promise<NextResponse> | NextResponse;

/**
 * Default error handler
 */
function defaultErrorHandler(error: { code: string; message: string }): NextResponse {
  const status = error.code === "UNAUTHORIZED" ? 401 : 403;
  return NextResponse.json(
    {
      error: error.message,
      code: error.code,
    },
    { status }
  );
}

/**
 * Extract region from request context
 */
async function extractRegion(
  request: NextRequest,
  regionCheck: WithAuthOptions["regionCheck"],
  params?: Promise<Record<string, string>>
): Promise<string | string[] | undefined> {
  if (typeof regionCheck === "function") {
    return await regionCheck(request, { params });
  }
  if (typeof regionCheck === "boolean") {
    return undefined; // Will be handled by caller
  }
  return regionCheck;
}

/**
 * withAuth - HOC for API route handlers with built-in authorization
 * 
 * Reduces boilerplate from ~20 lines to just a few:
 * 
 * Before:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const csrf = validateOrigin(request);
 *   if (csrf) return csrf;
 *   
 *   const session = await getSession();
 *   if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   if (session.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 *   
 *   // Actual logic here
 * }
 * ```
 * 
 * After:
 * ```typescript
 * export const POST = withAuth({
 *   role: "superadmin",
 *   csrf: true,
 * }, async (request, { session }) => {
 *   // Actual logic here - already authenticated!
 * });
 * ```
 */
export function withAuth(
  options: WithAuthOptions,
  handler: AuthHandler
): (request: NextRequest, { params }: { params?: Promise<Record<string, string>> }) => Promise<NextResponse> {
  return async function authWrappedHandler(
    request: NextRequest,
    { params }: { params?: Promise<Record<string, string>> }
  ): Promise<NextResponse> {
    // CSRF check
    if (options.csrf) {
      const csrfError = validateOrigin(request);
      if (csrfError) return csrfError;
    }

    // Normalize roles and permissions to arrays
    const roles = options.roles
      ? Array.isArray(options.roles)
        ? options.roles
        : [options.roles]
      : undefined;

    const permissions = options.permissions
      ? Array.isArray(options.permissions)
        ? options.permissions
        : [options.permissions]
      : undefined;

    // Extract region if needed
    let regionCheck: string | string[] | boolean | undefined;
    if (typeof options.regionCheck === "function") {
      regionCheck = await extractRegion(request, options.regionCheck, params);
    } else {
      regionCheck = options.regionCheck;
    }

    // Perform authorization check
    const result = await checkAuthorization({
      roles,
      permissions,
      requireAll: options.requireAll,
      regionCheck,
      allowSuperadminBypass: options.allowSuperadminBypass ?? true,
    });

    if (!result.authorized) {
      // Log denial if enabled
      if (options.logDenials !== false && result.session) {
        try {
          const forwardedFor = request.headers.get("x-forwarded-for");
          const ipAddress = forwardedFor
            ? forwardedFor.split(",")[0].trim()
            : "127.0.0.1";

          await createPermissionDenialLog({
            userId: result.session.id,
            userName: result.session.name,
            userRole: result.session.role,
            attemptedAction: `${request.method} ${request.nextUrl.pathname}`,
            requiredPermission:
              permissions || (roles as unknown as Permission[]),
            ipAddress,
            userAgent: request.headers.get("user-agent") || undefined,
            timestamp: new Date(),
          });
        } catch (err) {
          console.error("Failed to log permission denial:", err);
        }
      }

      // Return error
      const errorHandler = options.onError || defaultErrorHandler;
      return errorHandler(result.error!);
    }

    // Call the actual handler
    return await handler(request, { session: result.session!, params });
  };
}

/**
 * withAuth with POST method (convenience)
 */
export function withAuthPost(
  options: WithAuthOptions,
  handler: AuthHandler
) {
  return {
    POST: withAuth({ ...options, csrf: true }, handler),
  };
}

/**
 * withAuth with GET method (convenience)
 */
export function withAuthGet(
  options: WithAuthOptions,
  handler: AuthHandler
) {
  return {
    GET: withAuth({ ...options, csrf: false }, handler),
  };
}

/**
 * withAuth with PATCH method (convenience)
 */
export function withAuthPatch(
  options: WithAuthOptions,
  handler: AuthHandler
) {
  return {
    PATCH: withAuth({ ...options, csrf: true }, handler),
  };
}

/**
 * withAuth with DELETE method (convenience)
 */
export function withAuthDelete(
  options: WithAuthOptions,
  handler: AuthHandler
) {
  return {
    DELETE: withAuth({ ...options, csrf: true }, handler),
  };
}

/**
 * withAuth with PUT method (convenience)
 */
export function withAuthPut(
  options: WithAuthOptions,
  handler: AuthHandler
) {
  return {
    PUT: withAuth({ ...options, csrf: true }, handler),
  };
}

/**
 * withAuth for all common methods (GET, POST, PATCH, DELETE, PUT)
 * Each method can have different authorization requirements
 */
export function withAuthMethods(handlers: {
  GET?: { options: WithAuthOptions; handler: AuthHandler };
  POST?: { options: WithAuthOptions; handler: AuthHandler };
  PATCH?: { options: WithAuthOptions; handler: AuthHandler };
  PUT?: { options: WithAuthOptions; handler: AuthHandler };
  DELETE?: { options: WithAuthOptions; handler: AuthHandler };
}) {
  const methods: Record<string, (request: NextRequest, context: { params?: Promise<Record<string, string>> }) => Promise<NextResponse>> = {};

  if (handlers.GET) {
    methods.GET = withAuth(
      { ...handlers.GET.options, csrf: false },
      handlers.GET.handler
    );
  }

  if (handlers.POST) {
    methods.POST = withAuth(
      { ...handlers.POST.options, csrf: true },
      handlers.POST.handler
    );
  }

  if (handlers.PATCH) {
    methods.PATCH = withAuth(
      { ...handlers.PATCH.options, csrf: true },
      handlers.PATCH.handler
    );
  }

  if (handlers.PUT) {
    methods.PUT = withAuth(
      { ...handlers.PUT.options, csrf: true },
      handlers.PUT.handler
    );
  }

  if (handlers.DELETE) {
    methods.DELETE = withAuth(
      { ...handlers.DELETE.options, csrf: true },
      handlers.DELETE.handler
    );
  }

  return methods;
}

/**
 * Convenience function for superadmin-only routes
 */
export function withSuperAdmin(handler: AuthHandler) {
  return withAuth({ roles: "superadmin", csrf: true }, handler);
}

/**
 * Convenience function for authenticated routes (any logged-in user)
 */
export function withAnyAuth(handler: AuthHandler) {
  return withAuth({}, handler);
}

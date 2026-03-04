import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { checkAuthorization, toSessionUser } from "./helpers";
import type { AuthCheckOptions, SessionUser, Permission } from "./types";
import { createPermissionDenialLog } from "./audit";

/**
 * Extended request type with session data
 */
export interface AuthRequest extends NextRequest {
  auth?: {
    session: SessionUser;
  };
}

/**
 * RBAC Middleware Options
 */
export interface RBACMiddlewareOptions extends AuthCheckOptions {
  /**
   * Log permission denials for audit trail
   */
  logDenials?: boolean;
  
  /**
   * Custom error handler
   */
  onError?: (error: { code: string; message: string }, request: NextRequest) => NextResponse;
  
  /**
   * Skip checks for specific paths (regex patterns)
   */
  skipPaths?: RegExp[];
  
  /**
   * Additional context for logging
   */
  context?: {
    resourceId?: string;
    resourceRegion?: string;
  };
}

/**
 * Default error handler
 */
function defaultErrorHandler(
  error: { code: string; message: string },
  request: NextRequest
): NextResponse {
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
 * RBAC Middleware Factory
 * Creates middleware with specific authorization requirements
 * 
 * Usage:
 * ```typescript
 * export const middleware = createRBACMiddleware({
 *   permissions: ["listings:read"],
 *   logDenials: true,
 * });
 * 
 * export const config = {
 *   matcher: ["/api/admin/listings/:path*"],
 * };
 * ```
 */
export function createRBACMiddleware(options: RBACMiddlewareOptions) {
  return async function rbacMiddleware(
    request: NextRequest
  ): Promise<NextResponse | undefined> {
    // Check if path should be skipped
    if (options.skipPaths) {
      const pathname = request.nextUrl.pathname;
      for (const pattern of options.skipPaths) {
        if (pattern.test(pathname)) {
          return undefined; // Continue to next middleware/handler
        }
      }
    }

    // Check authorization
    const result = await checkAuthorization({
      roles: options.roles,
      permissions: options.permissions,
      requireAll: options.requireAll,
      regionCheck: options.regionCheck,
      allowSuperadminBypass: options.allowSuperadminBypass,
    });

    if (!result.authorized) {
      // Log the denial if enabled
      if (options.logDenials && result.session) {
        await logDenial(request, result.session, options, result.error!);
      }

      // Return error response
      const errorHandler = options.onError || defaultErrorHandler;
      return errorHandler(result.error!, request);
    }

    // Add session to request for downstream use
    (request as AuthRequest).auth = { session: result.session! };

    // Continue to next middleware/handler
    return undefined;
  };
}

/**
 * Log permission denial for audit
 */
async function logDenial(
  request: NextRequest,
  session: SessionUser,
  options: RBACMiddlewareOptions,
  error: { code: string; message: string }
): Promise<void> {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "127.0.0.1";

    await createPermissionDenialLog({
      userId: session.id,
      userName: session.name,
      userRole: session.role,
      attemptedAction: request.method + " " + request.nextUrl.pathname,
      requiredPermission:
        options.permissions || (options.roles as unknown as Permission),
      resourceId: options.context?.resourceId,
      resourceRegion: options.context?.resourceRegion,
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
      timestamp: new Date(),
    });
  } catch (err) {
    // Don't break the request if logging fails
    console.error("Failed to log permission denial:", err);
  }
}

/**
 * Route-specific RBAC guard
 * Use within route handlers for fine-grained control
 * 
 * Usage:
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const result = await rbacGuard(request, {
 *     permissions: ["listings:create"],
 *     regionCheck: true,
 *   });
 *   
 *   if (result.error) return result.response;
 *   
 *   const { session } = result;
 *   // Continue with authenticated logic...
 * }
 * ```
 */
export async function rbacGuard(
  request: NextRequest,
  options: RBACMiddlewareOptions
): Promise<
  | { success: true; session: SessionUser }
  | { success: false; error: { code: string; message: string }; response: NextResponse }
> {
  const result = await checkAuthorization({
    roles: options.roles,
    permissions: options.permissions,
    requireAll: options.requireAll,
    regionCheck: options.regionCheck,
    allowSuperadminBypass: options.allowSuperadminBypass,
  });

  if (!result.authorized) {
    // Log the denial if enabled
    if (options.logDenials && result.session) {
      await logDenial(request, result.session, options, result.error!);
    }

    const errorHandler = options.onError || defaultErrorHandler;
    return {
      success: false,
      error: result.error!,
      response: errorHandler(result.error!, request),
    };
  }

  return {
    success: true,
    session: result.session!,
  };
}

/**
 * Compose multiple middleware functions
 */
export function composeMiddleware(
  ...middlewares: Array<(request: NextRequest) => Promise<NextResponse | undefined>>
) {
  return async function composedMiddleware(
    request: NextRequest
  ): Promise<NextResponse | undefined> {
    for (const middleware of middlewares) {
      const result = await middleware(request);
      if (result) {
        return result;
      }
    }
    return undefined;
  };
}

/**
 * Middleware matcher for admin API routes
 */
export const adminApiMatcher = [
  "/api/admin/:path*",
];

/**
 * Middleware matcher for admin pages
 */
export const adminPageMatcher = [
  "/:locale/admin/:path*",
];

/**
 * Combined matcher for all protected routes
 */
export const protectedMatcher = [
  ...adminApiMatcher,
  ...adminPageMatcher,
];

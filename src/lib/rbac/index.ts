// RBAC Module Exports

// Types
export type {
  Role,
  Permission,
  SessionUser,
  AuthorizationResult,
  AuthCheckOptions,
  PermissionDenialLog,
  RoleChangeLog,
  AuthRequirement,
} from "./types";

// Constants
export {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_LABELS,
  PERMISSION_LABELS,
  PERMISSION_CATEGORIES,
  canManageRole,
  getRolePermissions,
} from "./constants";

// Helpers
export {
  toSessionUser,
  hasRole,
  hasPermission,
  hasRegionAccess,
  checkAuthorization,
  requireAuth,
  requirePermission,
  requireRole,
  requireRegionAccess,
  canManageTargetRole,
  buildRequirements,
  checkRequirements,
  createAuthErrorResponse,
} from "./helpers";

// Middleware
export {
  createRBACMiddleware,
  rbacGuard,
  composeMiddleware,
  type AuthRequest,
  type RBACMiddlewareOptions,
  adminApiMatcher,
  adminPageMatcher,
  protectedMatcher,
} from "./middleware";

// Wrapper
export {
  withAuth,
  withAuthPost,
  withAuthGet,
  withAuthPatch,
  withAuthDelete,
  withAuthPut,
  withAuthMethods,
  withSuperAdmin,
  withAnyAuth,
  type WithAuthOptions,
  type AuthHandlerContext,
  type AuthHandler,
} from "./wrapper";

// Audit
export {
  createPermissionDenialLog,
  createRoleChangeLog,
  createPermissionCheckLog,
  queryRoleAuditLogs,
} from "./audit";

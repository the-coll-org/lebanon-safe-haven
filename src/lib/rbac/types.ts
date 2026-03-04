import type { municipalities } from "@/db/schema";

export type Role =
  | "superadmin"
  | "regional_admin"
  | "municipality"
  | "moderator"
  | "viewer";

export type Permission =
  // Listings
  | "listings:read"
  | "listings:create"
  | "listings:update"
  | "listings:delete"
  | "listings:verify"
  | "listings:unflag"
  | "listings:bulk_import"
  | "listings:view_phone"
  // Users
  | "users:create"
  | "users:read"
  | "users:update"
  | "users:delete"
  | "users:manage_roles"
  // Audit & System
  | "logs:read"
  | "logs:export"
  | "feedback:read"
  | "feedback:manage"
  | "system:access_admin";

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  region: string;
  assignedRegions?: string[];
  permissionsOverride?: Permission[];
}

export type Municipality = typeof municipalities.$inferSelect;

export interface AuthorizationResult {
  authorized: boolean;
  error?: {
    code: "UNAUTHORIZED" | "FORBIDDEN" | "FORBIDDEN_REGION";
    message: string;
  };
  session?: SessionUser;
}

export interface AuthCheckOptions {
  roles?: Role[];
  permissions?: Permission[];
  requireAll?: boolean;
  regionCheck?: boolean | string | string[];
  allowSuperadminBypass?: boolean;
}

export interface PermissionDenialLog {
  userId: string;
  userName: string;
  userRole: Role;
  attemptedAction: string;
  requiredPermission: Permission | Permission[];
  resourceId?: string;
  resourceRegion?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
}

export interface RoleChangeLog {
  userId: string;
  userName: string;
  oldRole: Role;
  newRole: Role;
  performedById: string;
  performedByName: string;
  reason?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: Date;
}

export type AuthRequirement =
  | { type: "role"; value: Role | Role[] }
  | { type: "permission"; value: Permission | Permission[]; requireAll?: boolean }
  | { type: "region"; value: string | string[] }
  | { type: "custom"; check: (session: SessionUser, context?: unknown) => boolean | Promise<boolean> };

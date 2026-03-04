import type { Role, Permission } from "./types";

/**
 * All available roles in the system
 */
export const ROLES: Role[] = [
  "superadmin",
  "regional_admin",
  "municipality",
  "moderator",
  "viewer",
];

/**
 * All available permissions in the system
 */
export const PERMISSIONS: Permission[] = [
  // Listings
  "listings:read",
  "listings:create",
  "listings:update",
  "listings:delete",
  "listings:verify",
  "listings:unflag",
  "listings:bulk_import",
  "listings:view_phone",
  // Users
  "users:create",
  "users:read",
  "users:update",
  "users:delete",
  "users:manage_roles",
  // Audit & System
  "logs:read",
  "logs:export",
  "feedback:read",
  "feedback:manage",
  "system:access_admin",
];

/**
 * Default permissions assigned to each role
 * Superadmin has all permissions implicitly
 */
export const ROLE_PERMISSIONS: Record<Exclude<Role, "superadmin">, Permission[]> = {
  regional_admin: [
    "listings:read",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:verify",
    "listings:unflag",
    "listings:bulk_import",
    "listings:view_phone",
    "users:read",
    "users:create",
    "users:update",
    "logs:read",
    "logs:export",
    "feedback:read",
    "feedback:manage",
    "system:access_admin",
  ],
  municipality: [
    "listings:read",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:verify",
    "listings:unflag",
    "listings:view_phone",
    "feedback:read",
    "system:access_admin",
  ],
  moderator: [
    "listings:read",
    "listings:verify",
    "listings:unflag",
    "listings:view_phone",
    "feedback:read",
    "system:access_admin",
  ],
  viewer: [
    "listings:read",
    "system:access_admin",
  ],
};

/**
 * Human-readable role labels (for UI)
 */
export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Administrator",
  regional_admin: "Regional Administrator",
  municipality: "Municipality Admin",
  moderator: "Moderator",
  viewer: "Viewer",
};

/**
 * Human-readable permission labels (for UI)
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "listings:read": "View Listings",
  "listings:create": "Create Listings",
  "listings:update": "Edit Listings",
  "listings:delete": "Delete Listings",
  "listings:verify": "Verify Shelter Listings",
  "listings:unflag": "Remove Flags from Listings",
  "listings:bulk_import": "Bulk Import via CSV",
  "listings:view_phone": "View Phone Numbers",
  "users:create": "Create Users",
  "users:read": "View Users",
  "users:update": "Edit Users",
  "users:delete": "Delete Users",
  "users:manage_roles": "Manage User Roles",
  "logs:read": "View Audit Logs",
  "logs:export": "Export Audit Logs",
  "feedback:read": "View Feedback",
  "feedback:manage": "Manage Feedback",
  "system:access_admin": "Access Admin Dashboard",
};

/**
 * Permission categories for UI grouping
 */
export const PERMISSION_CATEGORIES: Record<string, Permission[]> = {
  Listings: [
    "listings:read",
    "listings:create",
    "listings:update",
    "listings:delete",
    "listings:verify",
    "listings:unflag",
    "listings:bulk_import",
    "listings:view_phone",
  ],
  Users: [
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "users:manage_roles",
  ],
  "Audit & System": [
    "logs:read",
    "logs:export",
    "feedback:read",
    "feedback:manage",
    "system:access_admin",
  ],
};

/**
 * Check if a role can manage another role
 * Returns true if managerRole can assign targetRole to users
 */
export function canManageRole(managerRole: Role, targetRole: Role): boolean {
  const hierarchy: Record<Role, number> = {
    viewer: 0,
    moderator: 1,
    municipality: 2,
    regional_admin: 3,
    superadmin: 4,
  };

  return hierarchy[managerRole] > hierarchy[targetRole];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  if (role === "superadmin") {
    return [...PERMISSIONS];
  }
  return [...ROLE_PERMISSIONS[role]];
}

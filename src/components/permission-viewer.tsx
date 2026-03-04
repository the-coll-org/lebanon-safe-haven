"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Shield,
  Users,
  FileText,
  ClipboardList,
  Settings
} from "lucide-react";
import { getRolePermissions, ROLE_PERMISSIONS, ROLE_LABELS } from "@/lib/rbac/constants";
import type { Role, Permission } from "@/lib/rbac/types";
import type { Region } from "@/types";

interface PermissionViewerProps {
  user: {
    id?: string;
    name: string;
    username: string;
    role: Role;
    region: Region;
    assignedRegions?: string[];
  };
  onClose?: () => void;
}

const PERMISSION_ICONS: Record<string, typeof Shield> = {
  listings: FileText,
  users: Users,
  logs: ClipboardList,
  feedback: ClipboardList,
  system: Settings,
};

const PERMISSION_CATEGORIES = {
  listings: "Listings",
  users: "Users",
  logs: "Audit & Logs",
  feedback: "Feedback",
  system: "System",
} as const;

export function PermissionViewer({ user }: PermissionViewerProps) {
  const t = useTranslations("admin");
  const tr = useTranslations("regions");

  const permissions = getRolePermissions(user.role);
  const allPermissions = Object.values(ROLE_PERMISSIONS).flat();
  const uniquePermissions = [...new Set(allPermissions)];

  // Group permissions by category
  const groupedPermissions = uniquePermissions.reduce((acc, permission) => {
    const [category] = permission.split(":");
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission as Permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  function hasPermission(permission: Permission): boolean {
    return permissions.includes(permission);
  }

  function getPermissionLabel(permission: Permission): string {
    const labels: Record<Permission, string> = {
      "listings:read": "View Listings",
      "listings:create": "Create Listings",
      "listings:update": "Edit Listings",
      "listings:delete": "Delete Listings",
      "listings:verify": "Verify Shelter Listings",
      "listings:unflag": "Remove Flags",
      "listings:bulk_import": "Bulk Import",
      "listings:view_phone": "View Phone Numbers",
      "users:create": "Create Users",
      "users:read": "View Users",
      "users:update": "Edit Users",
      "users:delete": "Delete Users",
      "users:manage_roles": "Manage User Roles",
      "logs:read": "View Logs",
      "logs:export": "Export Logs",
      "feedback:read": "View Feedback",
      "feedback:manage": "Manage Feedback",
      "system:access_admin": "Access Admin Dashboard",
    };
    return labels[permission] || permission;
  }

  function getRoleLabel(role: Role): string {
    switch (role) {
      case "superadmin":
        return t("roleSuperadmin");
      case "regional_admin":
        return t("roleRegionalAdmin");
      case "municipality":
        return t("roleMunicipality");
      case "moderator":
        return t("roleModerator");
      case "viewer":
        return t("roleViewer");
      default:
        return role;
    }
  }

  return (
    <div className="space-y-6">
      {/* User Info */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">@{user.username}</div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t("role")}: </span>
            <span className="font-medium">{getRoleLabel(user.role)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("region")}: </span>
            <span className="font-medium">{tr(user.region)}</span>
          </div>
        </div>
        
        {user.assignedRegions && user.assignedRegions.length > 0 && (
          <div className="mt-3 text-sm">
            <span className="text-muted-foreground">{t("assignedRegions")}: </span>
            <span className="font-medium">
              {user.assignedRegions.map((r) => tr(r)).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Permissions Summary */}
      <div>
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4" />
          {t("effectivePermissions")}
        </h3>
        
        <div className="text-xs text-muted-foreground mb-4">
          {permissions.length} of {uniquePermissions.length} permissions granted
        </div>

        <div className="space-y-4">
          {Object.entries(groupedPermissions).map(([category, perms]) => {
            const Icon = PERMISSION_ICONS[category] || Shield;
            
            return (
              <div key={category} className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-muted/50 border-b flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium capitalize">
                    {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES] || category}
                  </span>
                </div>
                
                <div className="divide-y">
                  {perms.map((permission) => {
                    const granted = hasPermission(permission);
                    
                    return (
                      <div
                        key={permission}
                        className="px-4 py-2 flex items-center justify-between"
                      >
                        <span className="text-sm">{getPermissionLabel(permission)}</span>
                        
                        {granted ? (
                          <Badge variant="default" className="gap-1 bg-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            {t("permissionGranted")}
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            {t("permissionDenied")}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Region Access Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Region Access</h4>
        <p className="text-sm text-muted-foreground">
          {user.role === "superadmin" ? (
            "This user has access to all regions."
          ) : user.assignedRegions && user.assignedRegions.length > 0 ? (
            `This user can manage listings in: ${user.assignedRegions.map((r) => tr(r)).join(", ")}`
          ) : (
            `This user can only manage listings in: ${tr(user.region)}`
          )}
        </p>
      </div>
    </div>
  );
}

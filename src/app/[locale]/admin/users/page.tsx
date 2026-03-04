"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, 
  Users, 
  Trash2, 
  Shield, 
  Search,
  Eye,
  AlertTriangle
} from "lucide-react";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { PermissionViewer } from "@/components/permission-viewer";
import type { Role, Region } from "@/types";

interface User {
  id: string;
  name: string;
  username: string;
  region: Region;
  role: Role;
  assignedRegions?: string[];
  createdAt: string;
}

const ROLE_COLORS: Record<Role, string> = {
  superadmin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  regional_admin: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  municipality: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  moderator: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export default function UsersPage() {
  const t = useTranslations("admin");
  const tr = useTranslations("regions");
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showPermissionViewer, setShowPermissionViewer] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== userToDelete.id));
        setUserToDelete(null);
        setShowDeleteDialog(false);
      } else {
        console.error("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.username.toLowerCase().includes(search.toLowerCase()) ||
      user.role.toLowerCase().includes(search.toLowerCase())
  );

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

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/dashboard")}
            className="gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t("usersTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("usersSubtitle")}</p>
          </div>
        </div>
        <CreateUserDialog />
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-16 bg-muted rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t("noUsers")}</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{user.name}</span>
                      <Badge className={ROLE_COLORS[user.role]}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{user.username} • {tr(user.region)}
                    </div>
                    
                    {user.assignedRegions && user.assignedRegions.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {t("assignedRegions")}: {user.assignedRegions.map((r) => tr(r)).join(", ")}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {t("createdAt")}: {formatDate(user.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setShowPermissionViewer(true);
                      }}
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      {t("viewPermissions")}
                    </Button>
                    
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setUserToDelete(user);
                        setShowDeleteDialog(true);
                      }}
                      className="gap-1"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("deleteUser")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Permission Viewer Dialog */}
      <Dialog open={showPermissionViewer} onOpenChange={setShowPermissionViewer}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("permissionsTitle")}
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <PermissionViewer 
              user={selectedUser}
              onClose={() => setShowPermissionViewer(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("deleteUserConfirm")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-muted-foreground">
              {t("deleteUserWarning")}
            </p>
            
            {userToDelete && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="font-medium">{userToDelete.name}</div>
                <div className="text-sm text-muted-foreground">
                  @{userToDelete.username} • {getRoleLabel(userToDelete.role)}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              {t("cancel")}
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteUser}
            >
              {t("deleteUser")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

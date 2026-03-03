"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Copy, Check, Users } from "lucide-react";
import { REGION_LIST } from "@/lib/constants";
import type { Region } from "@/types";

interface CreatedUser {
  username: string;
  password: string;
  name: string;
  region: string;
  role: string;
}

export function CreateUserDialog() {
  const t = useTranslations("admin");
  const tr = useTranslations("regions");

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [region, setRegion] = useState<Region>(REGION_LIST[0]);
  const [role, setRole] = useState<"municipality" | "superadmin">("municipality");

  // Success state
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  function resetForm() {
    setUsername("");
    setName("");
    setRegion(REGION_LIST[0]);
    setRole("municipality");
    setError("");
    setCreatedUser(null);
    setCopiedPassword(false);
    setCopiedUsername(false);
  }

  async function handleCreate() {
    if (!username || !name) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          name: name.trim(),
          region,
          role,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setCreatedUser({
          username: data.username,
          password: data.password,
          name: name.trim(),
          region,
          role,
        });
      } else {
        setError(data.error || t("createUserError"));
      }
    } catch {
      setError(t("createUserError"));
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string, type: "password" | "username") {
    navigator.clipboard.writeText(text);
    if (type === "password") {
      setCopiedPassword(true);
      setTimeout(() => setCopiedPassword(false), 2000);
    } else {
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    }
  }

  function handleClose() {
    setOpen(false);
    resetForm();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" />
          {t("createUser")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createUserTitle")}</DialogTitle>
        </DialogHeader>

        {!createdUser ? (
          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">{t("username")} *</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-8 text-sm"
                placeholder={t("usernamePlaceholder")}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t("usernameHint")}
              </p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">{t("name")} *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-sm"
                placeholder={t("namePlaceholder")}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">{t("region")} *</Label>
                <Select value={region} onValueChange={(v) => setRegion(v as Region)}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REGION_LIST.map((r) => (
                      <SelectItem key={r} value={r}>{tr(r)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{t("role")} *</Label>
                <Select value={role} onValueChange={(v) => setRole(v as "municipality" | "superadmin")}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="municipality">{t("roleMunicipality")}</SelectItem>
                    <SelectItem value="superadmin">{t("roleSuperadmin")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleCreate}
              disabled={loading || !username.trim() || !name.trim()}
              className="w-full"
            >
              {loading ? t("creatingUser") : t("createUser")}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200 rounded-md text-sm">
              {t("userCreatedSuccess")}
            </div>

            <Card className="border-amber-500/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-600 font-medium">
                  <Users className="h-4 w-4" />
                  {t("saveCredentials")}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{t("username")}</div>
                      <div className="font-mono text-sm truncate">{createdUser.username}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUser.username, "username")}
                      className="shrink-0"
                    >
                      {copiedUsername ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 bg-muted rounded">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-muted-foreground">{t("password")}</div>
                      <div className="font-mono text-sm truncate">{createdUser.password}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(createdUser.password, "password")}
                      className="shrink-0"
                    >
                      {copiedPassword ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                {t("close")}
              </Button>
              <Button
                onClick={() => {
                  resetForm();
                }}
                className="flex-1"
              >
                {t("createAnotherUser")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

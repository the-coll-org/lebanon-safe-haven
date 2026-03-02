"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export function AdminBadge() {
  const [adminName, setAdminName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAdminName(data.username);
      })
      .catch(() => {});
  }, []);

  if (!adminName) return null;

  return (
    <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
      <Link href="/admin/dashboard">
        <Shield className="h-3.5 w-3.5" />
        {adminName}
      </Link>
    </Button>
  );
}

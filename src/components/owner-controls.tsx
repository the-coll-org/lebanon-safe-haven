"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AlertTriangle, Ban, Trash2, RotateCcw, Save, Phone, Users } from "lucide-react";
import { toast } from "sonner";

interface OwnerControlsProps {
  listingId: string;
  editToken: string;
  status: string;
  unavailableCount: number;
  phone: string;
  capacity: number;
}

export function OwnerControls({
  listingId,
  editToken,
  status,
  unavailableCount,
  phone: initialPhone,
  capacity: initialCapacity,
}: OwnerControlsProps) {
  const t = useTranslations("owner");
  const tc = useTranslations("common");
  const router = useRouter();

  const [confirmAction, setConfirmAction] = useState<"unavailable" | "delete" | null>(null);
  const [loading, setLoading] = useState(false);

  // Editable fields
  const [phone, setPhone] = useState(initialPhone.replace(/\D/g, ""));
  const [capacity, setCapacity] = useState(String(initialCapacity));
  const [phoneError, setPhoneError] = useState("");
  const [saving, setSaving] = useState(false);

  async function markUnavailable() {
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editToken, status: "unavailable" }),
    });
    if (res.ok) {
      toast.success(t("updated"));
      setConfirmAction(null);
      router.refresh();
      // Force page reload to reflect new status
      window.location.reload();
    }
    setLoading(false);
  }

  async function deleteListing() {
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}?editToken=${editToken}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success(t("deleted"));
      router.push("/listings");
    }
    setLoading(false);
  }

  async function saveFields() {
    // Validate phone: exactly 8 digits
    if (phone.length !== 8) {
      setPhoneError(t("phoneInvalid"));
      return;
    }
    setPhoneError("");

    const cap = Number(capacity);
    if (!Number.isInteger(cap) || cap < 1 || cap > 10000) return;

    setSaving(true);
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editToken, phone, capacity: cap }),
    });
    if (res.ok) {
      toast.success(t("updated"));
      window.location.reload();
    }
    setSaving(false);
  }

  async function dismissUnavailableReports() {
    setLoading(true);
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ editToken, resetUnavailable: true }),
    });
    if (res.ok) {
      toast.success(t("updated"));
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <div className="rounded-sm border border-primary/30 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold">{t("banner")}</span>
      </div>

      {/* Editable fields */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="owner-phone" className="text-xs flex items-center gap-1">
            <Phone className="h-3 w-3" />
            {t("editPhone")}
          </Label>
          <div className="flex gap-2">
            <div className="flex items-center gap-1 rounded-sm border bg-muted px-2 text-sm text-muted-foreground shrink-0">
              +961
            </div>
            <Input
              id="owner-phone"
              type="tel"
              dir="ltr"
              inputMode="numeric"
              maxLength={8}
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setPhone(digits);
                if (phoneError) setPhoneError("");
              }}
              className="flex-1"
            />
          </div>
          {phoneError && (
            <p className="text-xs text-destructive">{phoneError}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="owner-capacity" className="text-xs flex items-center gap-1">
            <Users className="h-3 w-3" />
            {t("editCapacity")}
          </Label>
          <Input
            id="owner-capacity"
            type="number"
            min="1"
            dir="ltr"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          />
        </div>

        <Button
          size="sm"
          className="gap-1.5 rounded-sm"
          onClick={saveFields}
          disabled={saving}
        >
          <Save className="h-3.5 w-3.5" />
          {t("saveChanges")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "unavailable" && (
          <Dialog
            open={confirmAction === "unavailable"}
            onOpenChange={(open) => setConfirmAction(open ? "unavailable" : null)}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-sm">
                <Ban className="h-3.5 w-3.5" />
                {t("markUnavailable")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("markUnavailable")}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{t("confirmUnavailable")}</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setConfirmAction(null)}>
                  {tc("cancel")}
                </Button>
                <Button onClick={markUnavailable} disabled={loading}>
                  {t("confirm")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {unavailableCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-sm"
            onClick={dismissUnavailableReports}
            disabled={loading}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("dismissWarning")}
          </Button>
        )}

        <Dialog
          open={confirmAction === "delete"}
          onOpenChange={(open) => setConfirmAction(open ? "delete" : null)}
        >
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm" className="gap-1.5 rounded-sm">
              <Trash2 className="h-3.5 w-3.5" />
              {t("deleteListing")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("deleteListing")}</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">{t("confirmDelete")}</p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setConfirmAction(null)}>
                {tc("cancel")}
              </Button>
              <Button variant="destructive" onClick={deleteListing} disabled={loading}>
                {t("confirm")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

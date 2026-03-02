"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Pencil } from "lucide-react";
import { REGION_LIST, LISTING_CATEGORIES, LISTING_STATUSES } from "@/lib/constants";
import type { Listing } from "@/types";

interface AdminEditDialogProps {
  listing: Listing;
  onSaved: () => void;
}

export function AdminEditDialog({ listing, onSaved }: AdminEditDialogProps) {
  const t = useTranslations("admin");
  const tr = useTranslations("regions");
  const tcat = useTranslations("categories");
  const tl = useTranslations("listings");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState(listing.phone);
  const [region, setRegion] = useState(listing.region);
  const [category, setCategory] = useState(listing.category);
  const [status, setStatus] = useState(listing.status);
  const [area, setArea] = useState(listing.area || "");
  const [capacity, setCapacity] = useState(String(listing.capacity));
  const [description, setDescription] = useState(listing.description || "");

  function resetForm() {
    setPhone(listing.phone);
    setRegion(listing.region);
    setCategory(listing.category);
    setStatus(listing.status);
    setArea(listing.area || "");
    setCapacity(String(listing.capacity));
    setDescription(listing.description || "");
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/admin/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        region,
        category,
        status,
        area: area || null,
        capacity: Number(capacity),
        description: description || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      onSaved();
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Pencil className="h-3.5 w-3.5" />
          {t("editListing")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("editListing")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Phone */}
          <div className="space-y-1">
            <Label className="text-xs">{t("phone")}</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="h-8 text-sm"
            />
          </div>

          {/* Region + Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("region")}</Label>
              <Select value={region} onValueChange={(v) => setRegion(v as Listing["region"])}>
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
              <Label className="text-xs">{t("category")}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as Listing["category"])}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{tcat(c)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status + Capacity */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("status")}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Listing["status"])}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{tl(s as "available" | "limited" | "full")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("capacity")}</Label>
              <Input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Area */}
          <div className="space-y-1">
            <Label className="text-xs">{t("area")}</Label>
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-8 text-sm"
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs">{t("description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="text-sm"
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {t("saveChanges")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

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
import { Plus } from "lucide-react";
import { REGION_LIST, LISTING_CATEGORIES } from "@/lib/constants";
import type { Region, ListingCategory } from "@/types";

interface AdminCreateDialogProps {
  onCreated: () => void;
  defaultRegion?: Region | null;
}

export function AdminCreateDialog({ onCreated, defaultRegion }: AdminCreateDialogProps) {
  const t = useTranslations("admin");
  const tr = useTranslations("regions");
  const tcat = useTranslations("categories");

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState<Region>(defaultRegion || REGION_LIST[0]);
  const [category, setCategory] = useState<ListingCategory>("shelter");
  const [area, setArea] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");

  function resetForm() {
    setPhone("");
    setRegion(defaultRegion || REGION_LIST[0]);
    setCategory("shelter");
    setArea("");
    setCapacity("");
    setDescription("");
  }

  async function handleCreate() {
    if (!phone || !region || !capacity) return;
    
    setSaving(true);
    const res = await fetch("/api/admin/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        region,
        category,
        area: area || undefined,
        capacity: Number(capacity),
        description: description || undefined,
      }),
    });
    setSaving(false);
    
    if (res.ok) {
      setOpen(false);
      resetForm();
      onCreated();
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
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          {t("createListing")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createListing")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Phone */}
          <div className="space-y-1">
            <Label className="text-xs">{t("phone")} *</Label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
              className="h-8 text-sm"
              placeholder="+961 3 123 456"
              required
            />
          </div>

          {/* Region + Category */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">{t("region")} *</Label>
              <Select 
                value={region} 
                onValueChange={(v) => setRegion(v as Region)}
                disabled={!!defaultRegion}
              >
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
              <Label className="text-xs">{t("category")} *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as ListingCategory)}>
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

          {/* Capacity */}
          <div className="space-y-1">
            <Label className="text-xs">{t("capacity")} *</Label>
            <Input
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>

          {/* Area */}
          <div className="space-y-1">
            <Label className="text-xs">{t("area")}</Label>
            <Input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="h-8 text-sm"
              placeholder={t("areaPlaceholder")}
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label className="text-xs">{t("description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="text-sm"
              placeholder={t("descriptionPlaceholder")}
            />
          </div>

          <Button 
            onClick={handleCreate} 
            disabled={saving || !phone || !capacity} 
            className="w-full"
          >
            {saving ? t("creating") : t("createListing")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

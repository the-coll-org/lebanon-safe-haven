"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { REGION_LIST } from "@/lib/constants";
import { Disclaimer } from "./disclaimer";

export function OfferForm() {
  const t = useTranslations("offer");
  const tr = useTranslations("regions");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [area, setArea] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          region,
          area: area || null,
          capacity: Number(capacity),
          description: description || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create listing");

      const data = await res.json();
      router.push(`/offer/success?id=${data.id}&token=${data.editToken}`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")} *</Label>
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          placeholder={t("phonePlaceholder")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">{t("phoneDisclaimer")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="region">{t("region")} *</Label>
        <Select value={region} onValueChange={setRegion} required>
          <SelectTrigger id="region">
            <SelectValue placeholder={t("selectRegion")} />
          </SelectTrigger>
          <SelectContent>
            {REGION_LIST.map((r) => (
              <SelectItem key={r} value={r}>
                {tr(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="area">{t("area")}</Label>
        <Input
          id="area"
          placeholder={t("areaPlaceholder")}
          value={area}
          onChange={(e) => setArea(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="capacity">{t("capacity")} *</Label>
        <Input
          id="capacity"
          type="number"
          min="1"
          dir="ltr"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          placeholder={t("descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <Disclaimer />

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "..." : t("submitOffer")}
      </Button>
    </form>
  );
}

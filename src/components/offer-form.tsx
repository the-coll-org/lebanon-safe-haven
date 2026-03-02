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
import { REGION_LIST, LISTING_CATEGORIES } from "@/lib/constants";
import { MapPicker } from "./map-picker";
import { Disclaimer } from "./disclaimer";
import { Home, UtensilsCrossed, Plug, Shirt, X } from "lucide-react";
import type { Region } from "@/types";

const categoryIcons: Record<string, typeof Home> = {
  shelter: Home,
  food: UtensilsCrossed,
  appliances: Plug,
  clothing: Shirt,
};

export function OfferForm() {
  const t = useTranslations("offer");
  const tr = useTranslations("regions");
  const tcat = useTranslations("categories");
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [category, setCategory] = useState("shelter");
  const [area, setArea] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);

  const capacityLabel =
    category === "shelter"
      ? t("capacityPeople")
      : category === "food"
        ? t("capacityMeals")
        : t("capacityItems");

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
          category,
          area: area || null,
          capacity: Number(capacity),
          description: description || null,
          latitude: coords ? coords[0] : null,
          longitude: coords ? coords[1] : null,
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
        <Label htmlFor="category">{t("category")} *</Label>
        <Select value={category} onValueChange={setCategory} required>
          <SelectTrigger id="category">
            <SelectValue placeholder={t("selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {LISTING_CATEGORIES.map((c) => {
              const Icon = categoryIcons[c] || Home;
              return (
                <SelectItem key={c} value={c}>
                  <span className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {tcat(c)}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{t("phone")} *</Label>
        <Input
          id="phone"
          type="tel"
          dir="ltr"
          inputMode="numeric"
          maxLength={15}
          placeholder={t("phonePlaceholder")}
          value={phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            setPhone(digits);
          }}
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
        <Label>{t("location")}</Label>
        <p className="text-xs text-muted-foreground">{t("locationHelper")}</p>
        <MapPicker
          value={coords}
          onChange={setCoords}
          region={region ? (region as Region) : undefined}
        />
        {coords && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCoords(null)}
          >
            <X className="h-3 w-3 me-1" />
            {t("clearPin")}
          </Button>
        )}
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
        <Label htmlFor="capacity">{capacityLabel} *</Label>
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

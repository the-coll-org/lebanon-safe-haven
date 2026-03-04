"use client";

import { useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LISTING_CATEGORIES } from "@/lib/constants";
import {
  LEBANON_DIVISIONS,
  VILLAGES_BY_DISTRICT,
  VILLAGE_INFO,
  DISTRICT_INFO,
} from "@/lib/lebanon-divisions";
import type { Division } from "@/lib/lebanon-divisions";
import { LocationCombobox } from "./location-combobox";
import { MapPicker } from "./map-picker";
import { Disclaimer } from "./disclaimer";
import {
  Home,
  UtensilsCrossed,
  Plug,
  Shirt,
  X,
  CheckCircle,
  Copy,
  MessageCircle,
  AlertTriangle,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { Region } from "@/types";

const categoryIcons: Record<string, typeof Home> = {
  shelter: Home,
  food: UtensilsCrossed,
  appliances: Plug,
  clothing: Shirt,
};

export function OfferForm() {
  const t = useTranslations("offer");
  const ts = useTranslations("offerSuccess");
  const tcat = useTranslations("categories");
  const locale = useLocale();

  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [region, setRegion] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [category, setCategory] = useState("shelter");
  const [area, setArea] = useState("");
  const [capacity, setCapacity] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [phoneError, setPhoneError] = useState("");

  // Success dialog state
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState("");
  const [createdToken, setCreatedToken] = useState("");
  const [whatsAppClicked, setWhatsAppClicked] = useState(false);
  const [committed, setCommitted] = useState(false);

  // Get available divisions for cascading selects
  const mohafazatDivisions: Division[] = useMemo(
    () => LEBANON_DIVISIONS.map((m) => m.mohafaza),
    []
  );

  const districtDivisions: Division[] = useMemo(() => {
    if (!region) return [];
    const m = LEBANON_DIVISIONS.find((m) => m.mohafaza.slug === region);
    return m ? m.qadas.map((q) => q.qada) : [];
  }, [region]);

  const villageDivisions: Division[] = useMemo(() => {
    if (!district) return [];
    const slugs = VILLAGES_BY_DISTRICT[district] || [];
    return slugs.map((s) => VILLAGE_INFO[s]).filter(Boolean);
  }, [district]);

  const capacityLabel =
    category === "shelter"
      ? t("capacityPeople")
      : category === "food"
        ? t("capacityMeals")
        : t("capacityItems");

  const editUrl =
    typeof window !== "undefined" && createdId
      ? `${window.location.origin}/${locale}/listings/${createdId}?editToken=${createdToken}`
      : "";

  const whatsAppUrl = editUrl
    ? `https://wa.me/?text=${encodeURIComponent(ts("whatsAppMessage", { url: editUrl }))}`
    : "";

  function handleRegionChange(value: string) {
    setRegion(value);
    setDistrict("");
    setVillage("");
  }

  function handleDistrictChange(value: string) {
    setDistrict(value);
    setVillage("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate phone: exactly 8 digits
    if (phone.length !== 8) {
      setPhoneError(t("phoneInvalid"));
      return;
    }
    setPhoneError("");
    setLoading(true);

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          region,
          district: district || null,
          village: village || null,
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
      setCreatedId(data.id);
      setCreatedToken(data.editToken);
      setShowSuccess(true);
    } catch {
      setLoading(false);
    }
  }

  function copyEditLink() {
    navigator.clipboard.writeText(editUrl);
    toast.success(ts("copyLink"));
    setCommitted(true);
  }

  async function rollbackListing() {
    if (committed || !createdId || !createdToken) return;
    // Delete the uncommitted listing
    await fetch(`/api/listings/${createdId}?editToken=${createdToken}`, {
      method: "DELETE",
    });
    setShowSuccess(false);
    setCreatedId("");
    setCreatedToken("");
    setLoading(false);
  }

  return (
    <>
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
          <div className="flex gap-2">
            <div className="flex items-center gap-1 rounded-sm border bg-muted px-3 text-sm text-muted-foreground shrink-0">
              +961
            </div>
            <Input
              id="phone"
              type="tel"
              dir="ltr"
              inputMode="numeric"
              maxLength={8}
              placeholder={t("phonePlaceholder")}
              value={phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                setPhone(digits);
                if (phoneError) setPhoneError("");
              }}
              required
              className="flex-1"
            />
          </div>
          {phoneError && (
            <p className="text-xs text-destructive">{phoneError}</p>
          )}
          <p className="text-xs text-muted-foreground">{t("phoneDisclaimer")}</p>
        </div>

        <div className="space-y-2">
          <Label>{t("region")} *</Label>
          <LocationCombobox
            items={mohafazatDivisions}
            value={region}
            onChange={handleRegionChange}
            placeholder={t("selectRegion")}
            searchPlaceholder={t("searchRegion")}
            emptyText={t("noResults")}
            locale={locale}
          />
        </div>

        {districtDivisions.length > 1 && (
          <div className="space-y-2">
            <Label>{t("district")}</Label>
            <LocationCombobox
              items={districtDivisions}
              value={district}
              onChange={handleDistrictChange}
              placeholder={t("selectDistrict")}
              searchPlaceholder={t("searchDistrict")}
              emptyText={t("noResults")}
              locale={locale}
            />
          </div>
        )}

        {villageDivisions.length > 0 && (
          <div className="space-y-2">
            <Label>{t("village")}</Label>
            <LocationCombobox
              items={villageDivisions}
              value={village}
              onChange={setVillage}
              placeholder={t("selectVillage")}
              searchPlaceholder={t("searchVillage")}
              emptyText={t("noResults")}
              locale={locale}
            />
          </div>
        )}

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

      {/* Success Dialog — X button rolls back, backdrop click prevented */}
      <Dialog open={showSuccess} onOpenChange={(open) => { if (!open) rollbackListing(); }}>
        <DialogContent
          className="max-w-sm p-4 sm:p-6"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center items-center">
            <CheckCircle className="h-14 w-14 text-green-500 mb-1" />
            <DialogTitle className="text-base sm:text-xl font-extrabold uppercase tracking-wide text-secondary">
              {ts("title")}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{ts("subtitle")}</p>
          </DialogHeader>

          <div className="space-y-4">
            {/* Warning */}
            <div className="flex items-start gap-2 rounded-sm border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                {ts("warning")}
              </p>
            </div>

            {/* Primary CTA: WhatsApp */}
            <Button
              className="w-full gap-2 h-auto min-h-12 py-2 text-sm sm:text-base font-bold uppercase tracking-wide rounded-sm whitespace-normal text-center"
              onClick={() => {
                window.open(whatsAppUrl, "_blank");
                setWhatsAppClicked(true);
                setCommitted(true);
              }}
            >
              {whatsAppClicked ? (
                <Check className="h-5 w-5" />
              ) : (
                <MessageCircle className="h-5 w-5" />
              )}
              {whatsAppClicked ? ts("whatsAppSent") : ts("sendWhatsApp")}
            </Button>

            {/* Secondary: Copy link */}
            <Button
              variant="outline"
              className="w-full gap-2 rounded-sm"
              onClick={copyEditLink}
            >
              <Copy className="h-4 w-4" />
              {ts("copyLink")}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {ts("editLinkNote")}
            </p>

            {/* View Listing */}
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => setCommitted(true)}
              asChild
            >
              <Link href={`/listings/${createdId}`}>
                {ts("viewListing")}
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

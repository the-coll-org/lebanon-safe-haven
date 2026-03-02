"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { RegionFilter } from "@/components/region-filter";
import { CategoryFilter } from "@/components/category-filter";
import { ListingMap } from "@/components/listing-map";
import type { Listing } from "@/types";

export default function MapPage() {
  const t = useTranslations("map");
  const tl = useTranslations("listings");
  const tc = useTranslations("categories");
  const locale = useLocale();

  const [listings, setListings] = useState<Listing[]>([]);
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      const params = new URLSearchParams();
      if (region && region !== "all") params.set("region", region);
      if (category && category !== "all") params.set("category", category);
      const qs = params.toString();
      const res = await fetch(`/api/listings${qs ? `?${qs}` : ""}`);
      const data = await res.json();
      setListings(data);
      setLoading(false);
    }
    fetchListings();
  }, [region, category]);

  const labels = {
    viewDetails: t("viewDetails"),
    getDirections: t("getDirections"),
    approximateLocation: t("approximateLocation"),
    available: tl("available"),
    limited: tl("limited"),
    full: tl("full"),
    verified: t("verified"),
    capacity: tl("capacity"),
    shelter: tc("shelter"),
    food: tc("food"),
    appliances: tc("appliances"),
    clothing: tc("clothing"),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Filter bar */}
      <div className="flex gap-2 p-2 border-b bg-background shrink-0">
        <div className="w-40">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
        <div className="w-40">
          <RegionFilter value={region} onChange={setRegion} />
        </div>
        {/* Desktop legend */}
        <div className="hidden md:flex items-center gap-3 ms-auto text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#16a34a" }} />
            {t("legendShelter")}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#d97706" }} />
            {t("legendFood")}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#2563eb" }} />
            {t("legendAppliances")}
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full" style={{ background: "#9333ea" }} />
            {t("legendClothing")}
          </span>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
            <p className="text-muted-foreground animate-pulse">{t("loading")}</p>
          </div>
        )}
        <ListingMap listings={listings} locale={locale} labels={labels} />
      </div>
    </div>
  );
}

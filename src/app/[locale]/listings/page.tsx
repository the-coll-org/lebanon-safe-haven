"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ListingCard } from "@/components/listing-card";
import { RegionFilter } from "@/components/region-filter";
import { CategoryFilter } from "@/components/category-filter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Listing } from "@/types";

export default function ListingsPage() {
  const t = useTranslations("listings");
  const tr = useTranslations("regions");
  const [listings, setListings] = useState<Listing[]>([]);
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
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

  const searchLower = search.toLowerCase();
  const filtered = listings.filter(
    (l) =>
      !search ||
      tr(l.region).toLowerCase().includes(searchLower) ||
      (l.area && l.area.toLowerCase().includes(searchLower)) ||
      (l.description && l.description.toLowerCase().includes(searchLower))
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute inset-s-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-8 h-9"
        />
      </div>
      {/* Filters row */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
        <div className="flex-1">
          <RegionFilter value={region} onChange={setRegion} />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noListings")}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

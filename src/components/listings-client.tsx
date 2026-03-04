"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ListingCard } from "@/components/listing-card";
import { RegionFilter } from "@/components/region-filter";
import { CategoryFilter } from "@/components/category-filter";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import type { Listing } from "@/types";

interface ListingsClientProps {
  initialListings: Partial<Listing>[];
}

export function ListingsClient({ initialListings }: ListingsClientProps) {
  const t = useTranslations("listings");
  const tr = useTranslations("regions");
  
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  // Filter listings client-side
  const filteredListings = useMemo(() => {
    let result = initialListings;

    // Apply region filter
    if (region && region !== "all") {
      result = result.filter((l) => l.region === region);
    }

    // Apply category filter
    if (category && category !== "all") {
      result = result.filter((l) => l.category === category);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (l) =>
          tr(l.region!).toLowerCase().includes(searchLower) ||
          (l.area && l.area.toLowerCase().includes(searchLower)) ||
          (l.description && l.description.toLowerCase().includes(searchLower))
      );
    }

    return result;
  }, [initialListings, region, category, search, tr]);

  return (
    <>
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

      {filteredListings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noListings")}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing as Listing} />
          ))}
        </div>
      )}
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ListingCard } from "@/components/listing-card";
import { RegionFilter } from "@/components/region-filter";
import type { Listing } from "@/types";

export default function ListingsPage() {
  const t = useTranslations("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [region, setRegion] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      const params = region && region !== "all" ? `?region=${region}` : "";
      const res = await fetch(`/api/listings${params}`);
      const data = await res.json();
      setListings(data);
      setLoading(false);
    }
    fetchListings();
  }, [region]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <RegionFilter value={region} onChange={setRegion} />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          {/* Simple loading state */}
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noListings")}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}

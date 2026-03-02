"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/types";

const ListingMapInner = dynamic(
  () => import("./listing-map-inner").then((m) => m.ListingMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-muted animate-pulse" />
    ),
  }
);

interface ListingMapProps {
  listings: Listing[];
  locale: string;
  labels: {
    viewDetails: string;
    getDirections: string;
    approximateLocation: string;
    available: string;
    limited: string;
    full: string;
    verified: string;
    capacity: string;
    shelter: string;
    food: string;
    appliances: string;
    clothing: string;
  };
}

export function ListingMap({ listings, locale, labels }: ListingMapProps) {
  return <ListingMapInner listings={listings} locale={locale} labels={labels} />;
}

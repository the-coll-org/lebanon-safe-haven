"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { initLeafletIcons } from "@/lib/leaflet-setup";
import { REGION_CENTERS, LEBANON_CENTER, LEBANON_DEFAULT_ZOOM } from "@/lib/constants";
import type { Listing, Region } from "@/types";
import "leaflet/dist/leaflet.css";

initLeafletIcons();

const CATEGORY_COLORS: Record<string, string> = {
  shelter: "#16a34a",
  food: "#d97706",
  appliances: "#2563eb",
  clothing: "#9333ea",
};

function createCategoryIcon(category: string, isFull: boolean) {
  const color = CATEGORY_COLORS[category] || "#6b7280";
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};border:3px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      opacity:${isFull ? 0.5 : 1};
    "></div>`,
  });
}

interface ListingMapInnerProps {
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

export function ListingMapInner({ listings, locale, labels }: ListingMapInnerProps) {
  const isRtl = locale === "ar";
  const statusLabels: Record<string, string> = {
    available: labels.available,
    limited: labels.limited,
    full: labels.full,
  };
  const categoryLabels: Record<string, string> = {
    shelter: labels.shelter,
    food: labels.food,
    appliances: labels.appliances,
    clothing: labels.clothing,
  };

  return (
    <MapContainer
      center={LEBANON_CENTER}
      zoom={LEBANON_DEFAULT_ZOOM}
      className="h-full w-full z-0"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((listing) => {
        const hasExactCoords = listing.latitude != null && listing.longitude != null;
        const lat = listing.latitude ?? REGION_CENTERS[listing.region as Region]?.[0] ?? LEBANON_CENTER[0];
        const lng = listing.longitude ?? REGION_CENTERS[listing.region as Region]?.[1] ?? LEBANON_CENTER[1];

        return (
          <Marker
            key={listing.id}
            position={[lat, lng]}
            icon={createCategoryIcon(listing.category, listing.status === "full")}
          >
            <Popup>
              <div dir={isRtl ? "rtl" : "ltr"} style={{ minWidth: 180, fontSize: 14 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {categoryLabels[listing.category] || listing.category}
                </div>
                <div style={{ color: "#666", marginBottom: 4 }}>
                  {listing.area || "—"}
                </div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{
                    padding: "1px 6px",
                    borderRadius: 4,
                    fontSize: 12,
                    background: listing.status === "available" ? "#dcfce7" : listing.status === "limited" ? "#fef3c7" : "#fee2e2",
                    color: listing.status === "available" ? "#166534" : listing.status === "limited" ? "#92400e" : "#991b1b",
                  }}>
                    {statusLabels[listing.status] || listing.status}
                  </span>
                  {listing.verified && (
                    <span style={{
                      padding: "1px 6px",
                      borderRadius: 4,
                      fontSize: 12,
                      background: "#dbeafe",
                      color: "#1e40af",
                    }}>
                      {labels.verified}
                    </span>
                  )}
                </div>
                <div style={{ marginBottom: 6 }}>
                  {labels.capacity}: {listing.capacity}
                </div>
                {!hasExactCoords && (
                  <div style={{ color: "#d97706", fontSize: 12, marginBottom: 6 }}>
                    ~ {labels.approximateLocation}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={`/${locale}/listings/${listing.id}`}
                    style={{ color: "#2563eb", fontSize: 13 }}
                  >
                    {labels.viewDetails}
                  </a>
                  {hasExactCoords && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#2563eb", fontSize: 13 }}
                    >
                      {labels.getDirections}
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

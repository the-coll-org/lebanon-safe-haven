"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  MapPin,
  BadgeCheck,
  Home,
  UtensilsCrossed,
  Plug,
  Shirt,
  Phone,
} from "lucide-react";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  available: "default",
  limited: "secondary",
  full: "destructive",
};

const categoryIcons: Record<string, typeof Home> = {
  shelter: Home,
  food: UtensilsCrossed,
  appliances: Plug,
  clothing: Shirt,
};

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations("listings");
  const tc = useTranslations("common");
  const tr = useTranslations("regions");
  const tcat = useTranslations("categories");

  const CategoryIcon = categoryIcons[listing.category] || Home;

  const unitSingular =
    listing.category === "food" ? t("meal")
    : listing.category === "shelter" ? t("person")
    : t("item");
  const unitPlural =
    listing.category === "food" ? t("meals")
    : listing.category === "shelter" ? t("people")
    : t("items");

  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          {/* Row 1: Location + category + status */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="flex items-center gap-1 text-sm font-medium">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {tr(listing.region)}
              </span>
              {listing.area && (
                <span className="text-xs text-muted-foreground truncate">
                  {listing.area}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge variant="outline" className="gap-0.5 text-[11px] px-1.5 py-0">
                <CategoryIcon className="h-3 w-3" />
                {tcat(listing.category)}
              </Badge>
              {listing.verified && (
                <>
                  <BadgeCheck className="h-4 w-4 fill-blue-600 text-white shrink-0 sm:hidden" />
                  <Badge className="hidden sm:inline-flex gap-1 bg-blue-600 hover:bg-blue-700 text-[11px] px-1.5 py-0">
                    <BadgeCheck className="h-3 w-3" />
                    {tc("verified")}
                  </Badge>
                </>
              )}
              <Badge
                variant={statusVariant[listing.status] || "default"}
                className="text-[11px] px-1.5 py-0"
              >
                {t(listing.status as "available" | "limited" | "full")}
              </Badge>
            </div>
          </div>

          {/* Row 2: Capacity + description */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1 shrink-0">
              <Users className="h-3.5 w-3.5" />
              {listing.capacity} {listing.capacity === 1 ? unitSingular : unitPlural}
            </span>
            {listing.description && (
              <span className="truncate">{listing.description}</span>
            )}
          </div>

          {/* Row 3: Contact CTA */}
          <div className="flex items-center gap-1 text-xs text-primary">
            <Phone className="h-3 w-3" />
            <span>{tc("viewContact")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { getLocalizedName } from "@/lib/lebanon-divisions";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  available: "default",
  limited: "secondary",
  full: "destructive",
  unavailable: "destructive",
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
  const td = useTranslations("districts");
  const tcat = useTranslations("categories");
  const locale = useLocale();

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
    <Link href={`/listings/${listing.id}`} className="block group">
      <Card className="rounded-sm border-border hover:border-primary transition-colors duration-150">
        <CardContent className="p-3">
          {/* Row 1: Location + category + status */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <span className="flex items-center gap-1 text-sm font-semibold text-secondary uppercase tracking-wide">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {tr(listing.region)}
                {listing.district && (
                  <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">
                    — {td(listing.district)}
                  </span>
                )}
                {listing.village && (
                  <span className="text-xs font-normal normal-case tracking-normal text-muted-foreground">
                    — {getLocalizedName(listing.village, locale as "ar" | "en")}
                  </span>
                )}
              </span>
              {listing.area && (
                <span className="text-xs text-muted-foreground truncate">
                  {listing.area}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Badge
                variant="outline"
                className="gap-0.5 text-[11px] px-1.5 py-0 rounded-sm border-border"
              >
                <CategoryIcon className="h-3 w-3" />
                {tcat(listing.category)}
              </Badge>
              {listing.verified && (
                <>
                  <BadgeCheck className="h-4 w-4 fill-secondary text-white shrink-0 sm:hidden" />
                  <Badge className="hidden sm:inline-flex gap-1 bg-secondary hover:bg-secondary/90 text-[11px] px-1.5 py-0 rounded-sm">
                    <BadgeCheck className="h-3 w-3" />
                    {tc("verified")}
                  </Badge>
                </>
              )}
              <Badge
                variant={statusVariant[listing.status] || "default"}
                className="text-[11px] px-1.5 py-0 rounded-sm"
              >
                {t(listing.status as "available" | "limited" | "full" | "unavailable")}
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
              <span className="truncate max-w-[150px] sm:max-w-[250px]">{listing.description}</span>
            )}
          </div>

          {/* Row 3: Contact CTA */}
          <div className="flex items-center gap-1 text-xs text-primary font-semibold">
            <Phone className="h-3 w-3" />
            <span>{tc("viewContact")}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlagButton } from "@/components/flag-button";
import {
  Phone,
  MessageCircle,
  Users,
  MapPin,
  BadgeCheck,
  Home,
  UtensilsCrossed,
  Refrigerator,
  ArrowUpRight,
} from "lucide-react";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[\s-/]/g, "").replace(/^0+/, "");
  return `961${cleaned}`;
}

function formatPhoneForCall(phone: string): string {
  return phone.replace(/[\s]/g, "");
}

const statusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  available: "default",
  limited: "secondary",
  full: "destructive",
};

const categoryIcons: Record<string, typeof Home> = {
  shelter: Home,
  food: UtensilsCrossed,
  appliances: Refrigerator,
};

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations("listings");
  const tc = useTranslations("common");
  const tr = useTranslations("regions");
  const tcat = useTranslations("categories");

  const CategoryIcon = categoryIcons[listing.category] || Home;

  const unitSingular =
    listing.category === "food" ? t("meal")
    : listing.category === "appliances" ? t("item")
    : t("person");
  const unitPlural =
    listing.category === "food" ? t("meals")
    : listing.category === "appliances" ? t("items")
    : t("people");

  return (
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
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1 shrink-0">
            <Users className="h-3.5 w-3.5" />
            {listing.capacity} {listing.capacity === 1 ? unitSingular : unitPlural}
          </span>
          {listing.description && (
            <span className="truncate">{listing.description}</span>
          )}
        </div>

        {/* Row 3: Actions */}
        <div className="flex items-center gap-1.5">
          <Button size="sm" className="gap-1 h-7 text-xs flex-1" asChild>
            <a href={`tel:${formatPhoneForCall(listing.phone)}`}>
              <Phone className="h-3 w-3" />
              <span className="hidden sm:inline">{tc("call")}</span>
            </a>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1 h-7 text-xs flex-1"
            asChild
          >
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(listing.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-3 w-3" />
              <span className="hidden sm:inline">{tc("whatsapp")}</span>
            </a>
          </Button>
          <FlagButton listingId={listing.id} size="sm" />
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" asChild>
            <Link href={`/listings/${listing.id}`}>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

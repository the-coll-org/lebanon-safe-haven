"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Users, MapPin, BadgeCheck } from "lucide-react";
import type { Listing } from "@/types";

interface ListingCardProps {
  listing: Listing;
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove dashes, spaces, and leading zeros; assume Lebanon +961
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

export function ListingCard({ listing }: ListingCardProps) {
  const t = useTranslations("listings");
  const tc = useTranslations("common");
  const tr = useTranslations("regions");

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="gap-1">
              <MapPin className="h-3 w-3" />
              {tr(listing.region)}
            </Badge>
            {listing.area && (
              <span className="text-sm text-muted-foreground">
                {listing.area}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {listing.verified && (
              <Badge variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700">
                <BadgeCheck className="h-3 w-3" />
                {tc("verified")}
              </Badge>
            )}
            <Badge variant={statusVariant[listing.status] || "default"}>
              {t(listing.status as "available" | "limited" | "full")}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-sm mb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            {t("capacity")}: {listing.capacity}{" "}
            {listing.capacity === 1 ? t("person") : t("people")}
          </span>
        </div>

        {listing.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {listing.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" className="gap-1.5 flex-1" asChild>
            <a href={`tel:${formatPhoneForCall(listing.phone)}`}>
              <Phone className="h-3.5 w-3.5" />
              {tc("call")}
            </a>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-1.5 flex-1"
            asChild
          >
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(listing.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {tc("whatsapp")}
            </a>
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <Link href={`/listings/${listing.id}`}>
              &rarr;
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShareButton } from "@/components/share-button";
import { FlagButton } from "@/components/flag-button";
import { UnavailableButton } from "@/components/unavailable-button";
import { OwnerControls } from "@/components/owner-controls";
import { Disclaimer } from "@/components/disclaimer";
import {
  Phone,
  MessageCircle,
  Users,
  MapPin,
  BadgeCheck,
  ArrowLeft,
  ArrowRight,
  Home,
  UtensilsCrossed,
  Plug,
  Shirt,
  Navigation,
  AlertTriangle,
} from "lucide-react";
import { getLocalizedName } from "@/lib/lebanon-divisions";
import type { Listing } from "@/types";

function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[\s-/]/g, "").replace(/^0+/, "");
  return `961${cleaned}`;
}

function formatPhoneForCall(phone: string): string {
  return phone.replace(/[\s]/g, "");
}

const categoryIcons: Record<string, typeof Home> = {
  shelter: Home,
  food: UtensilsCrossed,
  appliances: Plug,
  clothing: Shirt,
};

const UNAVAILABLE_THRESHOLD = 3;

export default function ListingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("listings");
  const tc = useTranslations("common");
  const tr = useTranslations("regions");
  const td = useTranslations("districts");
  const tcat = useTranslations("categories");
  const tm = useTranslations("map");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const editToken = searchParams.get("editToken");
  const BackArrow = locale === "ar" ? ArrowRight : ArrowLeft;

  useEffect(() => {
    async function fetchListing() {
      const res = await fetch(`/api/listings/${params.id}`);
      if (res.ok) {
        setListing(await res.json());
      }
      setLoading(false);
    }
    fetchListing();
  }, [params.id]);

  // Verify edit token ownership
  useEffect(() => {
    if (!editToken || !listing) {
      setIsOwner(false);
      return;
    }
    // Verify token by attempting a no-op PATCH
    async function verifyToken() {
      const res = await fetch(`/api/listings/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken }),
      });
      setIsOwner(res.ok);
    }
    verifyToken();
  }, [editToken, listing, params.id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4 max-w-lg mx-auto">
          <div className="h-8 bg-muted rounded-sm w-1/3" />
          <div className="h-48 bg-muted rounded-sm" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">{tc("error")}</p>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href={"/listings"}>
            <BackArrow className="h-4 w-4 me-1" />
            {tc("back")}
          </Link>
        </Button>
      </div>
    );
  }

  const statusVariant: Record<string, "default" | "secondary" | "destructive"> =
    {
      available: "default",
      limited: "secondary",
      full: "destructive",
      unavailable: "destructive",
    };

  const CategoryIcon = categoryIcons[listing.category] || Home;

  const unitSingular =
    listing.category === "food" ? t("meal")
    : listing.category === "shelter" ? t("person")
    : t("item");
  const unitPlural =
    listing.category === "food" ? t("meals")
    : listing.category === "shelter" ? t("people")
    : t("people");

  const showUnavailableWarning =
    listing.unavailableCount >= UNAVAILABLE_THRESHOLD &&
    listing.status !== "unavailable";

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg overflow-x-hidden">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" asChild>
        <Link href={"/listings"}>
          <BackArrow className="h-4 w-4" />
          {tc("back")}
        </Link>
      </Button>

      {/* Owner controls */}
      {isOwner && editToken && (
        <div className="mb-4">
          <OwnerControls
            listingId={listing.id}
            editToken={editToken}
            status={listing.status}
            unavailableCount={listing.unavailableCount}
            phone={listing.phone}
            capacity={listing.capacity}
          />
        </div>
      )}

      {/* Unavailability warning banner */}
      {showUnavailableWarning && (
        <div className="flex items-start gap-2 rounded-sm border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 mb-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {t("unavailableWarning")}
          </p>
        </div>
      )}

      <Card className="rounded-sm border-border text-sm sm:text-base wrap-break-word">
        <CardHeader>
          <div className="flex flex-col items-center text-center gap-2">
            <CardTitle className="text-base sm:text-xl">
              <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap font-bold uppercase tracking-wide text-secondary">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                {tr(listing.region)}
              </div>
              {(listing.district || listing.village || listing.area) && (
                <div className="text-xs sm:text-sm font-normal normal-case tracking-normal text-muted-foreground mt-1">
                  {listing.district && td(listing.district)}
                  {listing.village && ` — ${getLocalizedName(listing.village, locale as "ar" | "en")}`}
                  {listing.area && ` — ${listing.area}`}
                </div>
              )}
            </CardTitle>
            <div className="flex gap-1.5 flex-wrap justify-center">
              <Badge variant="outline" className="gap-1 rounded-sm">
                <CategoryIcon className="h-3 w-3" />
                {tcat(listing.category)}
              </Badge>
              {listing.verified && (
                <Badge className="bg-secondary hover:bg-secondary/90 gap-1 rounded-sm">
                  <BadgeCheck className="h-3 w-3" />
                  {tc("verified")}
                </Badge>
              )}
              <Badge
                variant={statusVariant[listing.status] || "default"}
                className="rounded-sm"
              >
                {t(listing.status as "available" | "limited" | "full" | "unavailable")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {t("capacity")}: {listing.capacity}{" "}
              {listing.capacity === 1 ? unitSingular : unitPlural}
            </span>
          </div>

          {listing.description && (
            <p className="text-muted-foreground">{listing.description}</p>
          )}

          <p className="text-xs text-muted-foreground">
            {t("postedOn")}{" "}
            {new Date(listing.createdAt).toLocaleDateString(
              locale === "ar" ? "ar-LB" : "en-US"
            )}
          </p>

          {listing.latitude != null && listing.longitude != null && (
            <Button
              variant="outline"
              className="w-full gap-2 rounded-sm border-secondary/40 text-secondary hover:bg-secondary/5 hover:border-secondary font-semibold"
              asChild
            >
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="h-4 w-4" />
                {tm("getDirections")}
              </a>
            </Button>
          )}

          <Separator />

          {/* Contact buttons */}
          <div className="flex gap-2">
            {listing.status === "unavailable" ? (
              <>
                <Button className="flex-1 gap-2 rounded-sm font-bold uppercase tracking-wide" disabled>
                  <Phone className="h-4 w-4" />
                  {tc("call")}
                </Button>
                <Button variant="secondary" className="flex-1 gap-2 rounded-sm font-bold uppercase tracking-wide" disabled>
                  <MessageCircle className="h-4 w-4" />
                  {tc("whatsapp")}
                </Button>
              </>
            ) : (
              <>
                <Button className="flex-1 gap-2 rounded-sm font-bold uppercase tracking-wide" asChild>
                  <a href={`tel:${formatPhoneForCall(listing.phone)}`}>
                    <Phone className="h-4 w-4" />
                    {tc("call")}
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 gap-2 rounded-sm font-bold uppercase tracking-wide"
                  asChild
                >
                  <a
                    href={`https://wa.me/${formatPhoneForWhatsApp(listing.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {tc("whatsapp")}
                  </a>
                </Button>
              </>
            )}
          </div>

          {/* Actions row */}
          <div className="flex flex-wrap gap-2">
            <ShareButton />
            <UnavailableButton listingId={listing.id} />
            <FlagButton listingId={listing.id} />
          </div>

          <Disclaimer />
        </CardContent>
      </Card>
    </div>
  );
}

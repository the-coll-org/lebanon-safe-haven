"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ShareButton } from "@/components/share-button";
import { Disclaimer } from "@/components/disclaimer";
import {
  Phone,
  MessageCircle,
  Users,
  MapPin,
  BadgeCheck,
  Flag,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import type { Listing } from "@/types";

function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[\s-/]/g, "").replace(/^0+/, "");
  return `961${cleaned}`;
}

function formatPhoneForCall(phone: string): string {
  return phone.replace(/[\s]/g, "");
}

export default function ListingDetailPage() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("listings");
  const tc = useTranslations("common");
  const tf = useTranslations("flag");
  const tr = useTranslations("regions");

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitted, setFlagSubmitted] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);

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

  async function handleFlag() {
    await fetch(`/api/listings/${params.id}/flag`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: flagReason || null }),
    });
    setFlagSubmitted(true);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4 max-w-lg mx-auto">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded" />
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
    };

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <Button variant="ghost" size="sm" className="mb-4 gap-1" asChild>
        <Link href={"/listings"}>
          <BackArrow className="h-4 w-4" />
          {tc("back")}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-5 w-5" />
                {tr(listing.region)}
                {listing.area && (
                  <span className="text-base font-normal text-muted-foreground">
                    - {listing.area}
                  </span>
                )}
              </div>
            </CardTitle>
            <div className="flex gap-1.5 shrink-0">
              {listing.verified && (
                <Badge className="bg-blue-600 hover:bg-blue-700 gap-1">
                  <BadgeCheck className="h-3 w-3" />
                  {tc("verified")}
                </Badge>
              )}
              <Badge variant={statusVariant[listing.status] || "default"}>
                {t(listing.status as "available" | "limited" | "full")}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {t("capacity")}: {listing.capacity}{" "}
              {listing.capacity === 1 ? t("person") : t("people")}
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

          <Separator />

          {/* Contact buttons */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-2" asChild>
              <a href={`tel:${formatPhoneForCall(listing.phone)}`}>
                <Phone className="h-4 w-4" />
                {tc("call")}
              </a>
            </Button>
            <Button variant="secondary" className="flex-1 gap-2" asChild>
              <a
                href={`https://wa.me/${formatPhoneForWhatsApp(listing.phone)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle className="h-4 w-4" />
                {tc("whatsapp")}
              </a>
            </Button>
          </div>

          {/* Actions row */}
          <div className="flex gap-2">
            <ShareButton />
            <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  <Flag className="h-3.5 w-3.5" />
                  {tc("flag")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{tf("title")}</DialogTitle>
                </DialogHeader>
                {flagSubmitted ? (
                  <p className="text-sm text-muted-foreground py-4">
                    {tf("success")}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>{tf("reason")}</Label>
                      <Textarea
                        placeholder={tf("reasonPlaceholder")}
                        value={flagReason}
                        onChange={(e) => setFlagReason(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button onClick={handleFlag} className="w-full">
                      {tf("submit")}
                    </Button>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <Disclaimer />
        </CardContent>
      </Card>
    </div>
  );
}

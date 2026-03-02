"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BadgeCheck,
  LogOut,
  MapPin,
  Users,
  Phone,
  Flag,
} from "lucide-react";
import type { Listing } from "@/types";

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const tr = useTranslations("regions");
  const locale = useLocale();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchListings();
  }, []);

  async function fetchListings() {
    setLoading(true);
    const res = await fetch("/api/listings");
    if (res.ok) {
      setListings(await res.json());
    }
    setLoading(false);
  }

  async function handleVerify(id: string) {
    await fetch(`/api/admin/listings/${id}/verify`, { method: "PATCH" });
    fetchListings();
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  const unverified = listings.filter((l) => !l.verified);
  const flagged = listings.filter((l) => l.flagCount > 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </Button>
      </div>

      {/* Pending verification */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t("pendingListings")}</h2>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        ) : unverified.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noListings")}</p>
        ) : (
          <div className="space-y-3">
            {unverified.map((listing) => (
              <Card key={listing.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">
                          {tr(listing.region)}
                        </span>
                        {listing.area && (
                          <span className="text-sm text-muted-foreground">
                            - {listing.area}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {listing.capacity}
                        </span>
                        <span className="flex items-center gap-1" dir="ltr">
                          <Phone className="h-3.5 w-3.5" />
                          {listing.phone}
                        </span>
                        {listing.flagCount > 0 && (
                          <span className="flex items-center gap-1 text-destructive">
                            <Flag className="h-3.5 w-3.5" />
                            {listing.flagCount}
                          </span>
                        )}
                      </div>
                      {listing.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {listing.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="gap-1 shrink-0"
                      onClick={() => handleVerify(listing.id)}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {t("verifyListing")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator className="mb-8" />

      {/* Flagged */}
      <section>
        <h2 className="text-lg font-semibold mb-4">{t("flaggedListings")}</h2>
        {flagged.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {locale === "ar"
              ? "لا توجد أماكن مُبلّغ عنها"
              : "No flagged listings"}
          </p>
        ) : (
          <div className="space-y-3">
            {flagged.map((listing) => (
              <Card key={listing.id} className="border-destructive/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="font-medium">
                          {tr(listing.region)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="destructive" className="gap-1">
                          <Flag className="h-3 w-3" />
                          {listing.flagCount}{" "}
                          {locale === "ar" ? "بلاغ" : "flags"}
                        </Badge>
                        {listing.verified && (
                          <Badge className="bg-blue-600 gap-1">
                            <BadgeCheck className="h-3 w-3" />
                            {t("verified")}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" dir="ltr">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {listing.phone}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

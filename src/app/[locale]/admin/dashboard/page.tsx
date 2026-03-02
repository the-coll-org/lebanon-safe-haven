"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { AdminEditDialog } from "@/components/admin-edit-dialog";
import {
  BadgeCheck,
  LogOut,
  MapPin,
  Users,
  Phone,
  Flag,
  Home,
  UtensilsCrossed,
  Plug,
  Shirt,
  Search,
  Trash2,
} from "lucide-react";
import type { Listing, Region, AdminRole } from "@/types";

const categoryIcons: Record<string, typeof Home> = {
  shelter: Home,
  food: UtensilsCrossed,
  appliances: Plug,
  clothing: Shirt,
};

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const tr = useTranslations("regions");
  const tcat = useTranslations("categories");
  const locale = useLocale();
  const router = useRouter();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRegion, setAdminRegion] = useState<Region | null>(null);
  const [adminRole, setAdminRole] = useState<AdminRole>("municipality");
  const [adminName, setAdminName] = useState("");
  const [search, setSearch] = useState("");

  const isSuperadmin = adminRole === "superadmin";

  async function fetchListings(region?: string) {
    setLoading(true);
    const params = region ? `?region=${region}` : "";
    const res = await fetch(`/api/listings${params}`);
    if (res.ok) {
      setListings(await res.json());
    }
    setLoading(false);
  }

  function refreshListings() {
    fetchListings(isSuperadmin ? undefined : adminRegion || undefined);
  }

  async function handleVerify(id: string) {
    const res = await fetch(`/api/admin/listings/${id}/verify`, { method: "PATCH" });
    if (res.ok) refreshListings();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    if (res.ok) refreshListings();
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  useEffect(() => {
    let ignore = false;
    async function init() {
      const res = await fetch("/api/admin/me");
      if (!res.ok || ignore) return;
      const data = await res.json();
      setAdminRegion(data.region);
      setAdminRole(data.role || "municipality");
      setAdminName(data.name);
      const region = data.role === "superadmin" ? undefined : data.region;
      const params = region ? `?region=${region}` : "";
      const listingsRes = await fetch(`/api/listings${params}`);
      if (listingsRes.ok && !ignore) {
        setListings(await listingsRes.json());
      }
      if (!ignore) setLoading(false);
    }
    init();
    return () => { ignore = true; };
  }, []);

  const searchLower = search.toLowerCase();
  const matchesSearch = (l: Listing) =>
    !search ||
    l.phone.includes(search) ||
    (l.area && l.area.toLowerCase().includes(searchLower)) ||
    (l.description && l.description.toLowerCase().includes(searchLower)) ||
    l.category.toLowerCase().includes(searchLower);

  const unverified = listings.filter((l) => !l.verified && l.category === "shelter" && matchesSearch(l));
  const flagged = listings.filter((l) => l.flagCount > 0 && matchesSearch(l));

  function renderListingCard(listing: Listing, borderClass?: string) {
    const CategoryIcon = categoryIcons[listing.category] || Home;
    return (
      <Card key={listing.id} className={borderClass}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">{tr(listing.region)}</span>
                <Badge variant="outline" className="gap-1 text-xs">
                  <CategoryIcon className="h-3 w-3" />
                  {tcat(listing.category)}
                </Badge>
                {listing.area && (
                  <span className="text-sm text-muted-foreground">
                    - {listing.area}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
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
                {listing.verified && (
                  <Badge className="bg-blue-600 gap-1 text-xs">
                    <BadgeCheck className="h-3 w-3" />
                    {t("verified")}
                  </Badge>
                )}
              </div>
              {listing.description && (
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {listing.description}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 shrink-0">
              {!listing.verified && listing.category === "shelter" && (
                <Button
                  size="sm"
                  className="gap-1"
                  onClick={() => handleVerify(listing.id)}
                >
                  <BadgeCheck className="h-3.5 w-3.5" />
                  {t("verifyListing")}
                </Button>
              )}
              <AdminEditDialog listing={listing} onSaved={refreshListings} />
              {isSuperadmin && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  onClick={() => handleDelete(listing.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t("removeListing")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </Button>
      </div>
      {adminRegion && (
        <p className="text-sm text-muted-foreground mb-4">
          {adminName} — {isSuperadmin
            ? (locale === "ar" ? "مدير عام" : "Super Admin")
            : tr(adminRegion)}
        </p>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute inset-s-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-9"
        />
      </div>

      {/* Pending verification */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">
          {t("pendingListings")} ({unverified.length})
        </h2>
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
            {unverified.map((listing) => renderListingCard(listing))}
          </div>
        )}
      </section>

      <Separator className="mb-8" />

      {/* Flagged */}
      <section>
        <h2 className="text-lg font-semibold mb-4">
          {t("flaggedListings")} ({flagged.length})
        </h2>
        {flagged.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noFlaggedListings")}</p>
        ) : (
          <div className="space-y-3">
            {flagged.map((listing) =>
              renderListingCard(listing, "border-destructive/30")
            )}
          </div>
        )}
      </section>
    </div>
  );
}

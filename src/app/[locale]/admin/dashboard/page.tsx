"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { AdminEditDialog } from "@/components/admin-edit-dialog";
import { AdminCreateDialog } from "@/components/admin-create-dialog";
import { ImportExportDialog } from "@/components/import-export-dialog";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { CreateUserDialog } from "@/components/create-user-dialog";
import { LogsDialog } from "@/components/logs-dialog";
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
  AlertTriangle,
  FlagOff,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

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
    setSelectedIds(new Set());
  }

  async function handleVerify(id: string) {
    const res = await fetch(`/api/admin/listings/${id}/verify`, { method: "PATCH" });
    if (res.ok) refreshListings();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/listings/${id}`, { method: "DELETE" });
    if (res.ok) refreshListings();
  }

  async function handleUnflag(id: string) {
    const res = await fetch(`/api/admin/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unflag" }),
    });
    if (res.ok) refreshListings();
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    
    const res = await fetch("/api/admin/listings/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    });
    
    if (res.ok) refreshListings();
  }

  async function handleDeleteAll() {
    const res = await fetch("/api/admin/listings/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    
    if (res.ok) {
      setShowDeleteAllConfirm(false);
      refreshListings();
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  function toggleSelection(id: string) {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  }

  function toggleAllInSection(sectionListings: Listing[]) {
    const canDeleteIds = sectionListings
      .filter((l) => isSuperadmin || adminRegion === l.region)
      .map((l) => l.id);
    
    const newSelected = new Set(selectedIds);
    const allSelected = canDeleteIds.every((id) => newSelected.has(id));
    
    if (allSelected) {
      // Deselect all in this section
      canDeleteIds.forEach((id) => newSelected.delete(id));
    } else {
      // Select all in this section
      canDeleteIds.forEach((id) => newSelected.add(id));
    }
    
    setSelectedIds(newSelected);
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

  const allListings = listings.filter(matchesSearch);
  const unverified = listings.filter((l) => !l.verified && l.category === "shelter" && matchesSearch(l));
  const flagged = listings.filter((l) => l.flagCount > 0 && matchesSearch(l));

  const canDeleteAny = allListings.some((l) => isSuperadmin || adminRegion === l.region);

  function renderListingCard(listing: Listing, borderClass?: string, showCheckbox = true) {
    const CategoryIcon = categoryIcons[listing.category] || Home;
    const canDelete = isSuperadmin || adminRegion === listing.region;
    const isSelected = selectedIds.has(listing.id);
    
    return (
      <Card key={listing.id} className={borderClass}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {showCheckbox && canDelete && (
              <div className="pt-1">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleSelection(listing.id)}
                  aria-label={`Select listing ${listing.id}`}
                />
              </div>
            )}
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="font-medium">{tr(listing.region)}</span>
                <Badge variant="outline" className="gap-1 text-xs">
                  <CategoryIcon className="h-3 w-3" />
                  {tcat(listing.category)}
                </Badge>
                {listing.area && (
                  <span className="text-sm text-muted-foreground truncate">
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
              {listing.flagCount > 0 && canDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => handleUnflag(listing.id)}
                >
                  <FlagOff className="h-3.5 w-3.5" />
                  {t("unflag")}
                </Button>
              )}
              {canDelete && (
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

  function renderSection(
    title: string,
    sectionListings: Listing[],
    borderClass?: string
  ) {
    const deletableCount = sectionListings.filter(
      (l) => isSuperadmin || adminRegion === l.region
    ).length;
    const selectedCount = sectionListings.filter((l) => selectedIds.has(l.id)).length;
    const allSelected = deletableCount > 0 && selectedCount === deletableCount;

    return (
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {title} ({sectionListings.length})
          </h2>
          {deletableCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {selectedCount > 0 && `${selectedCount} ${t("selected")}`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllInSection(sectionListings)}
              >
                {allSelected ? t("deselectAll") : t("selectAll")}
              </Button>
            </div>
          )}
        </div>
        {loading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        ) : sectionListings.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noListings")}</p>
        ) : (
          <div className="space-y-3">
            {sectionListings.map((listing) =>
              renderListingCard(listing, borderClass)
            )}
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          {t("logout")}
        </Button>
      </div>
      {adminRegion && (
        <p className="text-sm text-muted-foreground mb-6">
          {adminName} — {isSuperadmin
            ? (locale === "ar" ? "مدير عام" : "Super Admin")
            : tr(adminRegion)}
        </p>
      )}

      {/* Create Listing & Import/Export Buttons */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <AdminCreateDialog 
          onCreated={refreshListings} 
          defaultRegion={isSuperadmin ? null : adminRegion}
        />
        <ImportExportDialog onImportSuccess={refreshListings} />
        <FeedbackDialog />
        {isSuperadmin && <CreateUserDialog />}
        {isSuperadmin && <LogsDialog />}
      </div>

      {/* Bulk Actions */}
      {canDeleteAny && (
        <div className="flex flex-wrap gap-2 mb-6 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium flex items-center">
            {selectedIds.size > 0
              ? t("selectedCount", { count: selectedIds.size })
              : t("bulkActions")}
          </span>
          <div className="flex-1" />
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              className="gap-1"
            >
              <Trash2 className="h-4 w-4" />
              {t("deleteSelected")}
            </Button>
          )}
          {isSuperadmin && allListings.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteAllConfirm(true)}
              className="gap-1"
            >
              <AlertTriangle className="h-4 w-4" />
              {t("deleteAll")}
            </Button>
          )}
        </div>
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
      {renderSection(t("pendingListings"), unverified)}

      <Separator className="mb-8" />

      {/* Flagged */}
      {renderSection(t("flaggedListings"), flagged, "border-destructive/30")}

      <Separator className="mb-8" />

      {/* All Listings */}
      {renderSection(t("allListings"), allListings)}

      {/* Delete All Confirmation Dialog */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md mx-4">
            <div className="flex items-center gap-2 mb-4 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">{t("confirmDeleteAll")}</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              {t("deleteAllWarning", { count: allListings.length })}
            </p>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteAllConfirm(false)}
              >
                {t("cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAll}
              >
                {t("confirmDelete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

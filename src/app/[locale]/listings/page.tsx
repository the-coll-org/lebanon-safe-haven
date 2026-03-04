import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { getListings } from "@/lib/data";
import { CACHE_TAGS } from "@/lib/revalidate";
import { ListingsClient } from "@/components/listings-client";
import { unstable_cache } from "next/cache";

// Revalidate the page every 60 seconds (ISR)
export const revalidate = 60;

// Generate static params for locales
export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

// Cached listings fetch with unstable_cache for persistent caching
const getCachedListings = unstable_cache(
  async () => getListings(),
  ["listings-page"],
  { tags: [CACHE_TAGS.LISTINGS] }
);

export default async function ListingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("listings");

  // Fetch listings with Data Cache (cached per-request) + unstable_cache (persistent)
  const listings = await getCachedListings();

  return (
    <div className="container mx-auto px-4 py-6">
<<<<<<< HEAD
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      
      <ListingsClient initialListings={listings} />
=======
      <h1 className="text-2xl font-extrabold uppercase tracking-wide mb-4 text-secondary">{t("title")}</h1>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute inset-s-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ps-8 h-9"
        />
      </div>
      {/* Filters row */}
      <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <CategoryFilter value={category} onChange={setCategory} />
        </div>
        <div className="flex-1">
          <RegionFilter value={region} onChange={setRegion} />
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("noListings")}</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
>>>>>>> fix/build-and-hydration
    </div>
  );
}

// Tags for on-demand revalidation
export const dynamicParams = true;

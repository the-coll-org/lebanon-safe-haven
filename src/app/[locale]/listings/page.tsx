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
      <h1 className="text-2xl font-bold mb-4">{t("title")}</h1>
      
      <ListingsClient initialListings={listings} />
    </div>
  );
}

// Tags for on-demand revalidation
export const dynamicParams = true;

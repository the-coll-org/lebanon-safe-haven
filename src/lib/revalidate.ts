import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Cache tags for different data types
 */
export const CACHE_TAGS = {
  LISTINGS: "listings",
  LISTING: (id: string) => `listing-${id}`,
  STATS: "stats",
} as const;

/**
 * Default cache profile for revalidation
 */
const DEFAULT_PROFILE = "default";

/**
 * Revalidate listings cache after mutations
 */
export async function revalidateListings(): Promise<void> {
  // Revalidate the Data Cache tag
  revalidateTag(CACHE_TAGS.LISTINGS, DEFAULT_PROFILE);

  // Revalidate ISR paths
  revalidatePath("/ar/listings", "page");
  revalidatePath("/en/listings", "page");
}

/**
 * Revalidate a specific listing
 */
export async function revalidateListing(id: string): Promise<void> {
  revalidateTag(CACHE_TAGS.LISTING(id), DEFAULT_PROFILE);
  revalidatePath(`/ar/listings/${id}`, "page");
  revalidatePath(`/en/listings/${id}`, "page");
}

/**
 * Revalidate all listing-related caches
 * Use this when bulk operations occur
 */
export async function revalidateAllListings(): Promise<void> {
  await revalidateListings();
  revalidateTag(CACHE_TAGS.STATS, DEFAULT_PROFILE);
}

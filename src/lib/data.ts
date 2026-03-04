import { cache } from "react";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { desc, eq, and, lt, sql } from "drizzle-orm";
import { decryptPhone } from "@/lib/crypto";
import { getSession } from "@/lib/auth";
import type { Region, ListingCategory, Listing } from "@/types";

/**
 * Convert DB listing to API response format
 */
function formatListing(listing: typeof listings.$inferSelect, includePhone = false): Partial<Listing> {
  const base = {
    id: listing.id,
    region: listing.region as Region,
    category: listing.category as ListingCategory,
    area: listing.area,
    capacity: listing.capacity,
    description: listing.description,
    status: listing.status as Listing['status'],
    verified: listing.verified,
    verifiedBy: listing.verifiedBy,
    flagCount: listing.flagCount,
    latitude: listing.latitude,
    longitude: listing.longitude,
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
  };

  if (includePhone) {
    return {
      ...base,
      phone: decryptPhone(listing.phone),
      editToken: listing.editToken,
    };
  }

  return base;
}

/**
 * Cached database query for fetching listings
 * Uses React's cache() for Request Memoization (Data Cache)
 * This deduplicates requests during the same render pass
 */
export const getListings = cache(async (
  region?: Region | null,
  category?: ListingCategory | null
): Promise<Partial<Listing>[]> => {
  // Clean up expired listings (runs periodically)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await db.delete(listings).where(lt(listings.createdAt, cutoff));

  const conditions = [];
  if (region) {
    conditions.push(eq(listings.region, region));
  }
  if (category) {
    conditions.push(eq(listings.category, category));
  }

  let query = db
    .select()
    .from(listings)
    .orderBy(desc(listings.createdAt));

  if (conditions.length === 1) {
    query = query.where(conditions[0]) as typeof query;
  } else if (conditions.length === 2) {
    query = query.where(and(conditions[0], conditions[1])) as typeof query;
  }

  const results = await query;

  // Check if admin session exists
  const session = await getSession();
  
  return results.map((listing) => formatListing(listing, !!session));
});

/**
 * Get a single listing by ID (cached)
 */
export const getListingById = cache(async (id: string): Promise<Partial<Listing> | null> => {
  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];

  if (!listing) {
    return null;
  }

  return formatListing(listing, true);
});

/**
 * Get listings count by region (for statistics)
 */
export const getListingsCountByRegion = cache(async (): Promise<Record<string, number>> => {
  const results = await db.select({
    region: listings.region,
    count: sql<number>`count(*)`,
  }).from(listings).groupBy(listings.region);

  return results.reduce((acc, row) => {
    acc[row.region] = Number(row.count);
    return acc;
  }, {} as Record<string, number>);
});

/**
 * Revalidate tag for cache invalidation
 * Use this tag when creating/updating/deleting listings
 */
export const LISTINGS_CACHE_TAG = "listings";

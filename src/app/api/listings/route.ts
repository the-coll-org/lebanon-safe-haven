import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { desc, eq, and, lt } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { REGION_LIST, LISTING_CATEGORIES } from "@/lib/constants";
import { ALL_DISTRICTS, DISTRICTS_BY_MOHAFAZA, ALL_VILLAGES, VILLAGES_BY_DISTRICT } from "@/lib/lebanon-divisions";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { encryptPhone, decryptPhone } from "@/lib/crypto";
import { getSession } from "@/lib/auth";
import { cachedJsonResponse, handleConditionalRequest, CACHE_DURATIONS } from "@/lib/cache";
import { revalidateListings } from "@/lib/revalidate";
import type { Region, ListingCategory } from "@/types";

// Phone: Lebanese numbers only — exactly 8 digits
const PHONE_REGEX = /^\d{8}$/;

// Auto-expire listings older than 30 days
async function cleanupExpired() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await db.delete(listings).where(lt(listings.createdAt, cutoff));
}

export async function GET(request: NextRequest) {
  // Periodically clean up old listings
  await cleanupExpired();

  const { searchParams } = request.nextUrl;
  const region = searchParams.get("region") as Region | null;
  const category = searchParams.get("category") as ListingCategory | null;

  const conditions = [];
  if (region && REGION_LIST.includes(region)) {
    conditions.push(eq(listings.region, region));
  }
  if (category && LISTING_CATEGORIES.includes(category)) {
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

  // Admin sees full data (decrypted phone); public gets no phone
  const session = await getSession();
  const mapped = results.map((listing) => {
    if (session) {
      return { ...listing, phone: decryptPhone(listing.phone) };
    }
    // Strip phone + editToken from public responses
    const { phone, editToken, ...safe } = listing; // eslint-disable-line @typescript-eslint/no-unused-vars
    return safe;
  });

  // Cache public listing data for 30 seconds with stale-while-revalidate
  if (!session) {
    return handleConditionalRequest(
      request,
      mapped,
      CACHE_DURATIONS.LISTINGS_FILTERED,
      { staleWhileRevalidate: 300 } // Allow stale data for 5 minutes while revalidating
    );
  }

  // Admin requests are private and cached for shorter duration
  return cachedJsonResponse(mapped, CACHE_DURATIONS.ADMIN_DATA, { private: true });
}

export async function POST(request: NextRequest) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  // 10 listings per hour per IP
  const limited = rateLimit(request, {
    name: "create-listing",
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (limited) return limited;

  const body = await request.json();
  const { phone, region, district, village, area, capacity, description, category, latitude, longitude } = body;

  if (!phone || !region || !capacity) {
    return NextResponse.json(
      { error: "Phone, region, and capacity are required" },
      { status: 400 }
    );
  }

  const cleanPhone = String(phone).trim();
  if (!PHONE_REGEX.test(cleanPhone)) {
    return NextResponse.json(
      { error: "Invalid phone number format" },
      { status: 400 }
    );
  }

  if (!REGION_LIST.includes(region)) {
    return NextResponse.json(
      { error: "Invalid region" },
      { status: 400 }
    );
  }

  const cat = category || "shelter";
  if (!LISTING_CATEGORIES.includes(cat)) {
    return NextResponse.json(
      { error: "Invalid category" },
      { status: 400 }
    );
  }

  const cap = Number(capacity);
  if (!Number.isInteger(cap) || cap < 1 || cap > 10000) {
    return NextResponse.json(
      { error: "Capacity must be between 1 and 10000" },
      { status: 400 }
    );
  }

  // Validate coordinates if provided (Lebanon bounding box)
  let validLat: number | null = null;
  let validLng: number | null = null;
  if (latitude != null && longitude != null) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      !isNaN(lat) && !isNaN(lng) &&
      lat >= 33.0 && lat <= 34.7 &&
      lng >= 35.0 && lng <= 36.7
    ) {
      validLat = lat;
      validLng = lng;
    }
  }

  const id = uuid();
  const editToken = uuid();
  const now = new Date();

  // Validate district if provided (must belong to selected region)
  let validDistrict: string | null = null;
  if (district && ALL_DISTRICTS.includes(district)) {
    const regionDistricts = DISTRICTS_BY_MOHAFAZA[region] || [];
    if (regionDistricts.includes(district)) {
      validDistrict = district;
    }
  }

  // Validate village if provided (must belong to selected district)
  let validVillage: string | null = null;
  if (village && validDistrict && ALL_VILLAGES.includes(village)) {
    const districtVillages = VILLAGES_BY_DISTRICT[validDistrict] || [];
    if (districtVillages.includes(village)) {
      validVillage = village;
    }
  }

  const listing = {
    id,
    phone: encryptPhone(cleanPhone),
    region,
    district: validDistrict,
    village: validVillage,
    category: cat,
    area: area ? String(area).slice(0, 200).trim() : null,
    capacity: cap,
    description: description ? String(description).slice(0, 1000).trim() : null,
    status: "available",
    editToken,
    verified: false,
    verifiedBy: null,
    flagCount: 0,
    unavailableCount: 0,
    latitude: validLat,
    longitude: validLng,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(listings).values(listing);

  // Revalidate listings cache to include new listing
  await revalidateListings();

  return NextResponse.json({ id, editToken }, { status: 201 });
}

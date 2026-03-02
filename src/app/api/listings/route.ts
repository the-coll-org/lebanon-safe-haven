import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { REGION_LIST, LISTING_CATEGORIES } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import type { Region, ListingCategory } from "@/types";

// Phone: Lebanese numbers only — digits, spaces, dashes, slashes, optional leading +
const PHONE_REGEX = /^\+?[\d\s\-/]{7,20}$/;

export async function GET(request: NextRequest) {
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

  const results = await query.all();
  return NextResponse.json(results);
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
  const { phone, region, area, capacity, description, category } = body;

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

  const id = uuid();
  const editToken = uuid();
  const now = new Date().toISOString();

  const listing = {
    id,
    phone: cleanPhone,
    region,
    category: cat,
    area: area ? String(area).slice(0, 200).trim() : null,
    capacity: cap,
    description: description ? String(description).slice(0, 1000).trim() : null,
    status: "available",
    editToken,
    verified: false,
    verifiedBy: null,
    flagCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(listings).values(listing).run();

  return NextResponse.json({ id, editToken }, { status: 201 });
}

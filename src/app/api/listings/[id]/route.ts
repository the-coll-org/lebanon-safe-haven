import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateOrigin } from "@/lib/csrf";
import { decryptPhone, encryptPhone } from "@/lib/crypto";
import { handleConditionalRequest, CACHE_DURATIONS } from "@/lib/cache";
import { revalidateListing } from "@/lib/revalidate";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  const session = await getSession();
  const { editToken, phone, ...safe } = listing; // eslint-disable-line @typescript-eslint/no-unused-vars
  // Only admins see decrypted phone; public gets no phone
  const responseData = session
    ? { ...safe, phone: decryptPhone(listing.phone) }
    : safe;

  // Cache individual listing for 1 minute with stale-while-revalidate
  return handleConditionalRequest(
    request,
    responseData,
    CACHE_DURATIONS.LISTINGS,
    { staleWhileRevalidate: 600 }
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  const body = await request.json();
  const { editToken, status, description, capacity, phone, latitude, longitude, resetUnavailable } = body;

  if (!editToken) {
    return NextResponse.json(
      { error: "Edit token is required" },
      { status: 401 }
    );
  }

  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.editToken !== editToken) {
    return NextResponse.json({ error: "Invalid edit token" }, { status: 403 });
  }

  const PHONE_REGEX = /^\d{8}$/;
  const validStatuses = ["available", "limited", "full", "unavailable"];
  const updates: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (status && validStatuses.includes(status)) updates.status = status;
  if (phone !== undefined) {
    const cleanPhone = String(phone).trim().replace(/\D/g, "");
    if (PHONE_REGEX.test(cleanPhone)) {
      updates.phone = encryptPhone(cleanPhone);
    }
  }
  if (resetUnavailable) updates.unavailableCount = 0;
  if (description !== undefined)
    updates.description = description
      ? String(description).slice(0, 1000).trim()
      : null;
  if (capacity !== undefined) {
    const cap = Number(capacity);
    if (Number.isInteger(cap) && cap >= 1 && cap <= 10000)
      updates.capacity = cap;
  }
  if (latitude !== undefined && longitude !== undefined) {
    if (latitude === null || longitude === null) {
      updates.latitude = null;
      updates.longitude = null;
    } else {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (
        !isNaN(lat) && !isNaN(lng) &&
        lat >= 33.0 && lat <= 34.7 &&
        lng >= 35.0 && lng <= 36.7
      ) {
        updates.latitude = lat;
        updates.longitude = lng;
      }
    }
  }

  await db.update(listings).set(updates).where(eq(listings.id, id));

  // Revalidate caches
  await revalidateListing(id);

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const editToken = searchParams.get("editToken");

  if (!editToken) {
    return NextResponse.json(
      { error: "Edit token is required" },
      { status: 401 }
    );
  }

  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.editToken !== editToken) {
    return NextResponse.json({ error: "Invalid edit token" }, { status: 403 });
  }

  await db.delete(listings).where(eq(listings.id, id));

  // Revalidate caches
  await revalidateListing(id);

  return NextResponse.json({ success: true });
}

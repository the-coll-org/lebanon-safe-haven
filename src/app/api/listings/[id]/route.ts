import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateOrigin } from "@/lib/csrf";
import { decryptPhone } from "@/lib/crypto";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Decrypt phone, strip editToken from public response
  const { editToken, ...safe } = listing; // eslint-disable-line @typescript-eslint/no-unused-vars
  return NextResponse.json({ ...safe, phone: decryptPhone(listing.phone) });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  const body = await request.json();
  const { editToken, status, description, capacity, latitude, longitude } = body;

  if (!editToken) {
    return NextResponse.json(
      { error: "Edit token is required" },
      { status: 401 }
    );
  }

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.editToken !== editToken) {
    return NextResponse.json({ error: "Invalid edit token" }, { status: 403 });
  }

  const validStatuses = ["available", "limited", "full"];
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (status && validStatuses.includes(status)) updates.status = status;
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

  db.update(listings).set(updates).where(eq(listings.id, id)).run();

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const editToken = searchParams.get("editToken");

  if (!editToken) {
    return NextResponse.json(
      { error: "Edit token is required" },
      { status: 401 }
    );
  }

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.editToken !== editToken) {
    return NextResponse.json({ error: "Invalid edit token" }, { status: 403 });
  }

  db.delete(listings).where(eq(listings.id, id)).run();

  return NextResponse.json({ success: true });
}

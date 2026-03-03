import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, flags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { REGION_LIST, LISTING_CATEGORIES, LISTING_STATUSES } from "@/lib/constants";
import { encryptPhone } from "@/lib/crypto";

const PHONE_REGEX = /^\+?[\d\s\-/]{7,20}$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (session.role !== "superadmin" && session.region !== listing.region) {
    return NextResponse.json(
      { error: "You can only edit listings in your region" },
      { status: 403 }
    );
  }

  const body = await request.json();

  // Handle unflag action
  if (body.action === "unflag") {
    // Check permissions
    if (session.role !== "superadmin" && session.region !== listing.region) {
      return NextResponse.json(
        { error: "You can only unflag listings in your region" },
        { status: 403 }
      );
    }

    // Delete all flags for this listing
    db.delete(flags).where(eq(flags.listingId, id)).run();

    // Reset flagCount to 0
    db.update(listings)
      .set({ flagCount: 0, updatedAt: new Date().toISOString() })
      .where(eq(listings.id, id))
      .run();

    return NextResponse.json({ success: true });
  }

  const updates: Record<string, unknown> = {};

  if (body.phone !== undefined) {
    const cleanPhone = String(body.phone).trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }
    updates.phone = encryptPhone(cleanPhone);
  }

  if (body.region !== undefined) {
    if (!REGION_LIST.includes(body.region)) {
      return NextResponse.json({ error: "Invalid region" }, { status: 400 });
    }
    updates.region = body.region;
  }

  if (body.category !== undefined) {
    if (!LISTING_CATEGORIES.includes(body.category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    updates.category = body.category;
  }

  if (body.status !== undefined) {
    if (!LISTING_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    updates.status = body.status;
  }

  if (body.capacity !== undefined) {
    const cap = Number(body.capacity);
    if (!Number.isInteger(cap) || cap < 1) {
      return NextResponse.json({ error: "Invalid capacity" }, { status: 400 });
    }
    updates.capacity = cap;
  }

  if (body.area !== undefined) {
    updates.area = body.area ? String(body.area).trim() : null;
  }

  if (body.description !== undefined) {
    updates.description = body.description ? String(body.description).trim() : null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  updates.updatedAt = new Date().toISOString();

  db.update(listings).set(updates).where(eq(listings.id, id)).run();

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();
  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Superadmins can delete any listing; municipality admins only their region
  if (session.role !== "superadmin" && session.region !== listing.region) {
    return NextResponse.json(
      { error: "You can only delete listings in your region" },
      { status: 403 }
    );
  }

  // Delete associated flags first (FK constraint)
  db.delete(flags).where(eq(flags.listingId, id)).run();
  db.delete(listings).where(eq(listings.id, id)).run();

  return NextResponse.json({ success: true });
}

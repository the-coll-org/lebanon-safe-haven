import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, flags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { createLog } from "@/lib/logging";
import { REGION_LIST, LISTING_CATEGORIES, LISTING_STATUSES } from "@/lib/constants";
import { ALL_DISTRICTS, DISTRICTS_BY_MOHAFAZA, ALL_VILLAGES, VILLAGES_BY_DISTRICT } from "@/lib/lebanon-divisions";
import { encryptPhone } from "@/lib/crypto";

const PHONE_REGEX = /^\d{8}$/;

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

  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];
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
    await db.delete(flags).where(eq(flags.listingId, id));

    // Reset flagCount to 0
    await db.update(listings)
      .set({ flagCount: 0, updatedAt: new Date() })
      .where(eq(listings.id, id));

    // Log unflag action
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    await createLog({
      action: "unflag",
      entityType: "listing",
      entityId: id,
      userId: session.id,
      userName: session.name,
      details: `Unflagged listing in ${listing.region}`,
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  }

  const updates: Record<string, unknown> = {};

  if (body.phone !== undefined) {
    const cleanPhone = String(body.phone).trim().replace(/\D/g, "");
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

  if (body.district !== undefined) {
    if (body.district) {
      const effectiveRegion = (updates.region as string) || listing.region;
      if (ALL_DISTRICTS.includes(body.district)) {
        const regionDistricts = DISTRICTS_BY_MOHAFAZA[effectiveRegion] || [];
        if (regionDistricts.includes(body.district)) {
          updates.district = body.district;
        }
      }
    } else {
      updates.district = null;
      updates.village = null; // clear village when district is cleared
    }
  }

  if (body.village !== undefined) {
    if (body.village) {
      const effectiveDistrict = (updates.district as string) || listing.district;
      if (effectiveDistrict && ALL_VILLAGES.includes(body.village)) {
        const districtVillages = VILLAGES_BY_DISTRICT[effectiveDistrict] || [];
        if (districtVillages.includes(body.village)) {
          updates.village = body.village;
        }
      }
    } else {
      updates.village = null;
    }
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

  updates.updatedAt = new Date();

  await db.update(listings).set(updates).where(eq(listings.id, id));

  // Log update action
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  await createLog({
    action: "update",
    entityType: "listing",
    entityId: id,
    userId: session.id,
    userName: session.name,
    details: `Updated listing in ${listing.region}. Fields: ${Object.keys(updates).join(", ")}`,
    ipAddress,
    userAgent: request.headers.get("user-agent") || undefined,
  });

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

  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];
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
  await db.delete(flags).where(eq(flags.listingId, id));
  await db.delete(listings).where(eq(listings.id, id));

  // Log deletion
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  await createLog({
    action: "delete",
    entityType: "listing",
    entityId: id,
    userId: session.id,
    userName: session.name,
    details: `Deleted ${listing.category} listing in ${listing.region}`,
    ipAddress,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  return NextResponse.json({ success: true });
}

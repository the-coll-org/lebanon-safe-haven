import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, flags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createLog } from "@/lib/logging";
import { withAuth } from "@/lib/rbac/wrapper";
import { hasRegionAccess } from "@/lib/rbac/helpers";
import { REGION_LIST, LISTING_CATEGORIES, LISTING_STATUSES } from "@/lib/constants";
import { encryptPhone } from "@/lib/crypto";

const PHONE_REGEX = /^\+?[\d\s\-/]{7,20}$/;

/**
 * PATCH /api/admin/listings/[id]
 * Update a listing or unflag it
 */
export const PATCH = withAuth(
  {
    permissions: ["listings:update", "listings:unflag"],
    csrf: true,
    logDenials: true,
  },
  async (request, { session, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = result[0];
    
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check region access
    if (!hasRegionAccess(session, listing.region)) {
      return NextResponse.json(
        { error: "You can only edit listings in your assigned regions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Handle unflag action
    if (body.action === "unflag") {
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

    // Handle regular updates
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
      // Check if user has access to the new region
      if (!hasRegionAccess(session, body.region)) {
        return NextResponse.json(
          { error: "You don't have access to the target region" },
          { status: 403 }
        );
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
);

/**
 * DELETE /api/admin/listings/[id]
 * Delete a listing
 */
export const DELETE = withAuth(
  {
    permissions: "listings:delete",
    csrf: true,
    logDenials: true,
  },
  async (request, { session, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = result[0];
    
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Check region access
    if (!hasRegionAccess(session, listing.region)) {
      return NextResponse.json(
        { error: "You can only delete listings in your assigned regions" },
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
);

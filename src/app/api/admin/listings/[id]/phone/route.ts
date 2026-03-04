import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { withAuth } from "@/lib/rbac/wrapper";
import { hasRegionAccess } from "@/lib/rbac/helpers";
import { encryptPhone } from "@/lib/crypto";

const PHONE_REGEX = /^\+?[\d\s\-/]{7,20}$/;

/**
 * PATCH /api/admin/listings/[id]/phone
 * Update phone number for a listing
 */
export const PATCH = withAuth(
  {
    permissions: "listings:update",
    csrf: true,
    logDenials: true,
  },
  async (request, { session, params }) => {
    const resolvedParams = await params;
    const id = resolvedParams?.id;
    
    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }
    
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: "Phone is required" }, { status: 400 });
    }

    const cleanPhone = String(phone).trim();
    if (!PHONE_REGEX.test(cleanPhone)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
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

    await db.update(listings)
      .set({
        phone: encryptPhone(cleanPhone),
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));

    return NextResponse.json({ success: true });
  }
);

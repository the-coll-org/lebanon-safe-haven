import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createLog } from "@/lib/logging";
import { withAuth } from "@/lib/rbac/wrapper";
import { hasRegionAccess } from "@/lib/rbac/helpers";

/**
 * PATCH /api/admin/listings/[id]/verify
 * Verify a shelter listing
 */
export const PATCH = withAuth(
  {
    permissions: "listings:verify",
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

    // Only shelter listings can be verified
    if (listing.category !== "shelter") {
      return NextResponse.json(
        { error: "Only shelter listings can be verified" },
        { status: 400 }
      );
    }

    // Check region access
    if (!hasRegionAccess(session, listing.region)) {
      return NextResponse.json(
        { error: "You can only verify listings in your assigned regions" },
        { status: 403 }
      );
    }

    await db.update(listings)
      .set({
        verified: true,
        verifiedBy: session.username,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));

    // Log verification
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
    await createLog({
      action: "verify",
      entityType: "listing",
      entityId: id,
      userId: session.id,
      userName: session.name,
      details: `Verified shelter listing in ${listing.region}`,
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ success: true });
  }
);

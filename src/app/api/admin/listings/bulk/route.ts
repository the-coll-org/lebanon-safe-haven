import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, flags } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";

export async function DELETE(request: NextRequest) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids, all } = body;

    if (all) {
      // Delete all listings (superadmin only)
      if (session.role !== "superadmin") {
        return NextResponse.json(
          { error: "Only superadmins can delete all listings" },
          { status: 403 }
        );
      }

      // Get all listing IDs to delete their flags first
      const allListings = db.select({ id: listings.id }).from(listings).all();
      const allIds = allListings.map((l) => l.id);

      // Delete all flags first
      if (allIds.length > 0) {
        db.delete(flags).where(inArray(flags.listingId, allIds)).run();
      }

      // Delete all listings
      db.delete(listings).run();

      return NextResponse.json({ 
        success: true, 
        deleted: allIds.length 
      });
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No IDs provided" },
        { status: 400 }
      );
    }

    // Fetch listings to check permissions
    const listingsToDelete = db
      .select()
      .from(listings)
      .where(inArray(listings.id, ids))
      .all();

    // Check permissions - superadmins can delete any, municipality admins only their region
    const allowedIds: string[] = [];
    const forbiddenIds: string[] = [];

    for (const listing of listingsToDelete) {
      if (session.role === "superadmin" || session.region === listing.region) {
        allowedIds.push(listing.id);
      } else {
        forbiddenIds.push(listing.id);
      }
    }

    if (allowedIds.length === 0) {
      return NextResponse.json(
        { error: "No permission to delete these listings" },
        { status: 403 }
      );
    }

    // Delete associated flags first (FK constraint)
    if (allowedIds.length > 0) {
      db.delete(flags).where(inArray(flags.listingId, allowedIds)).run();
    }

    // Delete the listings
    db.delete(listings).where(inArray(listings.id, allowedIds)).run();

    return NextResponse.json({
      success: true,
      deleted: allowedIds.length,
      skipped: forbiddenIds.length,
    });
  } catch (err) {
    console.error("Bulk delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete listings", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

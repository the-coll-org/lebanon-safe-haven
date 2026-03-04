import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, flags } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { createLog } from "@/lib/logging";
import { withAuth } from "@/lib/rbac/wrapper";
import { hasRegionAccess } from "@/lib/rbac/helpers";

/**
 * DELETE /api/admin/listings/bulk
 * Bulk delete listings
 */
export const DELETE = withAuth(
  {
    permissions: "listings:delete",
    csrf: true,
    logDenials: true,
  },
  async (request, { session }) => {
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
        const allListings = await db.select({ id: listings.id }).from(listings);
        const allIds = allListings.map((l) => l.id);

        // Delete all flags first
        if (allIds.length > 0) {
          await db.delete(flags).where(inArray(flags.listingId, allIds));
        }

        // Delete all listings
        await db.delete(listings);

        // Log bulk delete all
        const forwardedFor = request.headers.get("x-forwarded-for");
        const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
        await createLog({
          action: "bulk_delete",
          entityType: "listing",
          userId: session.id,
          userName: session.name,
          details: `Bulk deleted all ${allIds.length} listings`,
          ipAddress,
          userAgent: request.headers.get("user-agent") || undefined,
        });

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
      const listingsToDelete = await db
        .select()
        .from(listings)
        .where(inArray(listings.id, ids));

      // Check permissions - superadmins can delete any, others only their regions
      const allowedIds: string[] = [];
      const forbiddenIds: string[] = [];

      for (const listing of listingsToDelete) {
        if (hasRegionAccess(session, listing.region)) {
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
        await db.delete(flags).where(inArray(flags.listingId, allowedIds));
      }

      // Delete the listings
      await db.delete(listings).where(inArray(listings.id, allowedIds));

      // Log bulk delete
      const forwardedFor = request.headers.get("x-forwarded-for");
      const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
      await createLog({
        action: "bulk_delete",
        entityType: "listing",
        userId: session.id,
        userName: session.name,
        details: `Bulk deleted ${allowedIds.length} listings (${forbiddenIds.length} skipped due to permissions)`,
        ipAddress,
        userAgent: request.headers.get("user-agent") || undefined,
      });

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
);

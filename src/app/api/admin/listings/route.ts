import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { encryptPhone } from "@/lib/crypto";
import { createLog } from "@/lib/logging";
import { withAuth } from "@/lib/rbac/wrapper";
import { hasRegionAccess } from "@/lib/rbac/helpers";
import { REGION_LIST, LISTING_CATEGORIES } from "@/lib/constants";
import { v4 as uuid } from "uuid";

const PHONE_REGEX = /^\+?[\d\s\-/]{7,20}$/;

/**
 * POST /api/admin/listings
 * Create a new listing
 * 
 * Using RBAC with permission-based authorization
 */
export const POST = withAuth(
  {
    permissions: "listings:create",
    csrf: true,
    logDenials: true,
  },
  async (request, { session }) => {
    const body = await request.json();
    const {
      phone,
      region,
      area,
      capacity,
      description,
      category,
      latitude,
      longitude,
    } = body;

    if (!phone || !region || !capacity) {
      return NextResponse.json(
        { error: "Phone, region, and capacity are required" },
        { status: 400 }
      );
    }

    // Check region access
    if (!hasRegionAccess(session, region)) {
      return NextResponse.json(
        { error: "You can only create listings in your assigned regions" },
        { status: 403 }
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
      return NextResponse.json({ error: "Invalid region" }, { status: 400 });
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

    // Validate coordinates if provided
    let validLat: number | null = null;
    let validLng: number | null = null;
    if (latitude != null && longitude != null) {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= 33.0 &&
        lat <= 34.7 &&
        lng >= 35.0 &&
        lng <= 36.7
      ) {
        validLat = lat;
        validLng = lng;
      }
    }

    const id = uuid();
    const editToken = uuid();
    const now = new Date();

    const listing = {
      id,
      phone: encryptPhone(cleanPhone),
      region,
      category: cat,
      area: area ? String(area).slice(0, 200).trim() : null,
      capacity: cap,
      description: description
        ? String(description).slice(0, 1000).trim()
        : null,
      status: "available",
      editToken,
      verified: session.role === "superadmin",
      verifiedBy: session.role === "superadmin" ? session.username : null,
      flagCount: 0,
      latitude: validLat,
      longitude: validLng,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(listings).values(listing);

    // Log listing creation
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "127.0.0.1";

    await createLog({
      action: "create",
      entityType: "listing",
      entityId: id,
      userId: session.id,
      userName: session.name,
      details: `Created ${cat} listing in ${region} with capacity ${cap}`,
      ipAddress,
      userAgent: request.headers.get("user-agent") || undefined,
    });

    return NextResponse.json({ id, editToken }, { status: 201 });
  }
);

/**
 * GET /api/admin/listings
 * List all listings
 * 
 * Regional admins see listings in their assigned regions
 * Municipality users see listings in their region only
 * Superadmins see all listings
 */
export const GET = withAuth(
  {
    permissions: "listings:read",
  },
  async (request, { session }) => {
    try {
      // Fetch all listings first, then filter by region access
      // This is simpler than building complex Drizzle queries
      const allListings = await db.select().from(listings);

      // Filter by region access
      let filteredListings = allListings;
      
      if (session.role !== "superadmin") {
        if (session.assignedRegions && session.assignedRegions.length > 0) {
          // Regional admin - filter to assigned regions
          filteredListings = allListings.filter((listing) =>
            session.assignedRegions!.includes(listing.region)
          );
        } else {
          // Single region user
          filteredListings = allListings.filter(
            (listing) => listing.region === session.region
          );
        }
      }

      // Apply query filters from URL
      const { searchParams } = new URL(request.url);
      const regionFilter = searchParams.get("region");
      const statusFilter = searchParams.get("status");
      const verifiedFilter = searchParams.get("verified");

      if (regionFilter) {
        // Check access to requested region
        if (!hasRegionAccess(session, regionFilter)) {
          return NextResponse.json(
            { error: "You don't have access to this region" },
            { status: 403 }
          );
        }
        filteredListings = filteredListings.filter(
          (listing) => listing.region === regionFilter
        );
      }

      if (statusFilter) {
        filteredListings = filteredListings.filter(
          (listing) => listing.status === statusFilter
        );
      }

      if (verifiedFilter !== null) {
        const isVerified = verifiedFilter === "true";
        filteredListings = filteredListings.filter(
          (listing) => listing.verified === isVerified
        );
      }

      // Sort by creation date (newest first)
      filteredListings.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return NextResponse.json({ listings: filteredListings });
    } catch (error) {
      console.error("Error fetching listings:", error);
      return NextResponse.json(
        { error: "Failed to fetch listings" },
        { status: 500 }
      );
    }
  }
);

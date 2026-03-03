import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { encryptPhone, decryptPhone } from "@/lib/crypto";
import { REGION_LIST, LISTING_CATEGORIES, REGIONS } from "@/lib/constants";
import { v4 as uuid } from "uuid";
import * as XLSX from "xlsx";
import type { Region } from "@/types";

const PHONE_REGEX = /^\+?[\d\s\-/]{7,20}$/;

// Helper to normalize region names
function normalizeRegion(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  
  // Direct match (e.g., "beirut" -> "beirut")
  if (REGION_LIST.includes(normalized as Region)) {
    return normalized;
  }
  
  // Try to match by display name (e.g., "Beirut" -> "beirut")
  for (const [code, names] of Object.entries(REGIONS)) {
    if (
      normalized === names.en.toLowerCase() ||
      normalized === names.ar ||
      normalized === code
    ) {
      return code;
    }
  }
  
  // Handle common variations
  const variations: Record<string, string> = {
    "beirut": "beirut",
    "beyrouth": "beirut",
    "بيروت": "beirut",
    "mount lebanon": "mount_lebanon",
    "jabal lebanon": "mount_lebanon",
    "جبل لبنان": "mount_lebanon",
    "south lebanon": "south_lebanon",
    "جنوب لبنان": "south_lebanon",
    "north lebanon": "north_lebanon",
    "شمال لبنان": "north_lebanon",
    "nabatieh": "nabatieh",
    "النبطية": "nabatieh",
    "bekaa": "bekaa",
    "البقاع": "bekaa",
    "baalbek": "baalbek_hermel",
    "baalbek hermel": "baalbek_hermel",
    "baalbek-hermel": "baalbek_hermel",
    "بعلبك": "baalbek_hermel",
    "akkar": "akkar",
    "عكار": "akkar",
  };
  
  return variations[normalized] || null;
}

export async function POST(request: NextRequest) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { phone, region, area, capacity, description, category, latitude, longitude } = body;

  if (!phone || !region || !capacity) {
    return NextResponse.json(
      { error: "Phone, region, and capacity are required" },
      { status: 400 }
    );
  }

  // Check permissions - municipality admins can only create in their region
  if (session.role !== "superadmin" && session.region !== region) {
    return NextResponse.json(
      { error: "You can only create listings in your region" },
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
    return NextResponse.json(
      { error: "Invalid region" },
      { status: 400 }
    );
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

  // Validate coordinates if provided (Lebanon bounding box)
  let validLat: number | null = null;
  let validLng: number | null = null;
  if (latitude != null && longitude != null) {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (
      !isNaN(lat) && !isNaN(lng) &&
      lat >= 33.0 && lat <= 34.7 &&
      lng >= 35.0 && lng <= 36.7
    ) {
      validLat = lat;
      validLng = lng;
    }
  }

  const id = uuid();
  const editToken = uuid();
  const now = new Date().toISOString();

  const listing = {
    id,
    phone: encryptPhone(cleanPhone),
    region,
    category: cat,
    area: area ? String(area).slice(0, 200).trim() : null,
    capacity: cap,
    description: description ? String(description).slice(0, 1000).trim() : null,
    status: "available",
    editToken,
    verified: session.role === "superadmin", // Superadmin listings are auto-verified
    verifiedBy: session.role === "superadmin" ? session.username : null,
    flagCount: 0,
    latitude: validLat,
    longitude: validLng,
    createdAt: now,
    updatedAt: now,
  };

  db.insert(listings).values(listing).run();

  return NextResponse.json({ id, editToken }, { status: 201 });
}

// Export listings to Excel
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const format = searchParams.get("format");

  if (format !== "xlsx") {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }

  // Get listings based on permissions
  let query = db.select().from(listings);
  if (session.role !== "superadmin" && session.region) {
    query = query.where(eq(listings.region, session.region)) as typeof query;
  }

  const allListings = query.all();

  // Prepare data for export
  const exportData = allListings.map((listing) => ({
    ID: listing.id,
    Phone: decryptPhone(listing.phone),
    Region: listing.region,
    Area: listing.area || "",
    Category: listing.category,
    Capacity: listing.capacity,
    Description: listing.description || "",
    Status: listing.status,
    Verified: listing.verified ? "Yes" : "No",
    "Flag Count": listing.flagCount,
    "Created At": listing.createdAt,
    "Updated At": listing.updatedAt,
    Latitude: listing.latitude || "",
    Longitude: listing.longitude || "",
  }));

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  XLSX.utils.book_append_sheet(wb, ws, "Listings");

  // Generate buffer
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="listings_${new Date().toISOString().split("T")[0]}.xlsx"`,
    },
  });
}

// Import listings from Excel
export async function PATCH(request: NextRequest) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, unknown>>;

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of jsonData) {
      try {
        const phone = String(row.Phone || row.phone || "").trim();
        const regionInput = String(row.Region || row.region || "").trim();
        const region = normalizeRegion(regionInput);
        const category = String(row.Category || row.category || "shelter").trim();
        const capacity = Number(row.Capacity || row.capacity || 0);
        const area = String(row.Area || row.area || "").trim() || null;
        const description = String(row.Description || row.description || "").trim() || null;
        const latitude = row.Latitude || row.latitude ? Number(row.Latitude || row.latitude) : null;
        const longitude = row.Longitude || row.longitude ? Number(row.Longitude || row.longitude) : null;

        // Validation
        if (!phone || !regionInput || !capacity) {
          results.failed++;
          results.errors.push(`Row missing required fields: ${JSON.stringify(row)}`);
          continue;
        }

        if (!PHONE_REGEX.test(phone)) {
          results.failed++;
          results.errors.push(`Invalid phone: ${phone}`);
          continue;
        }

        if (!region) {
          results.failed++;
          results.errors.push(`Invalid region: "${regionInput}". Valid regions: ${REGION_LIST.join(", ")}`);
          continue;
        }

        // Normalize category
        const normalizedCategory = category.toLowerCase();
        const validCategory = LISTING_CATEGORIES.includes(normalizedCategory as typeof LISTING_CATEGORIES[number])
          ? normalizedCategory
          : null;

        if (!validCategory) {
          results.failed++;
          results.errors.push(`Invalid category: "${category}". Valid categories: ${LISTING_CATEGORIES.join(", ")}`);
          continue;
        }

        if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) {
          results.failed++;
          results.errors.push(`Invalid capacity: ${capacity}`);
          continue;
        }

        // Check permissions
        if (session.role !== "superadmin" && session.region !== region) {
          results.failed++;
          results.errors.push(`Cannot create listing in region: ${region}`);
          continue;
        }

        // Validate coordinates
        let validLat: number | null = null;
        let validLng: number | null = null;
        if (latitude != null && longitude != null) {
          if (
            !isNaN(latitude) && !isNaN(longitude) &&
            latitude >= 33.0 && latitude <= 34.7 &&
            longitude >= 35.0 && longitude <= 36.7
          ) {
            validLat = latitude;
            validLng = longitude;
          }
        }

        const id = uuid();
        const editToken = uuid();
        const now = new Date().toISOString();

        const listing = {
          id,
          phone: encryptPhone(phone),
          region,
          category: validCategory,
          area: area ? area.slice(0, 200) : null,
          capacity,
          description: description ? description.slice(0, 1000) : null,
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

        db.insert(listings).values(listing).run();
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Error processing row: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    return NextResponse.json({
      success: results.success,
      failed: results.failed,
      errors: results.errors.slice(0, 10), // Limit errors returned
      total: jsonData.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to process file", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

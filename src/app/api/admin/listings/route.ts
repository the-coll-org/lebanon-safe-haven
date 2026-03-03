import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";

import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { encryptPhone } from "@/lib/crypto";
import { REGION_LIST, LISTING_CATEGORIES, REGIONS } from "@/lib/constants";
import { v4 as uuid } from "uuid";

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
  const now = new Date();

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

  await db.insert(listings).values(listing);

  return NextResponse.json({ id, editToken }, { status: 201 });
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

// Parse CSV content to array of objects
function parseCSV(csvContent: string): Array<Record<string, string>> {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const result: Array<Record<string, string>> = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    
    result.push(row);
  }
  
  return result;
}

// Import listings from CSV
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

    // Read file as text
    const csvContent = await file.text();
    const jsonData = parseCSV(csvContent);

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const row of jsonData) {
      try {
        const phone = String(row.phone || "").trim();
        const regionInput = String(row.region || "").trim();
        const region = normalizeRegion(regionInput);
        const category = String(row.category || "shelter").trim();
        const capacity = Number(row.capacity || 0);
        const area = String(row.area || "").trim() || null;
        const description = String(row.description || "").trim() || null;
        const latitude = row.latitude ? Number(row.latitude) : null;
        const longitude = row.longitude ? Number(row.longitude) : null;

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
        const now = new Date();

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

        await db.insert(listings).values(listing);
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

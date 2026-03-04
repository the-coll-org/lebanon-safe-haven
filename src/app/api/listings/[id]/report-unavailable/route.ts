import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, unavailableReports } from "@/db/schema";
import { eq, and, gt, lt, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import crypto from "crypto";

function hashIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  // General rate limit: 10 reports per hour per IP
  const limited = rateLimit(request, {
    name: "report-unavailable",
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (limited) return limited;

  const { id } = await params;
  const ipHash = hashIp(request);

  // Check listing exists
  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  // Check for duplicate report from same IP in last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await db
    .select()
    .from(unavailableReports)
    .where(
      and(
        eq(unavailableReports.listingId, id),
        eq(unavailableReports.ipHash, ipHash),
        gt(unavailableReports.createdAt, oneDayAgo)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: "Already reported" }, { status: 429 });
  }

  // Clean up reports older than 7 days for this listing
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await db
    .delete(unavailableReports)
    .where(
      and(
        eq(unavailableReports.listingId, id),
        lt(unavailableReports.createdAt, sevenDaysAgo)
      )
    );

  // Create report
  await db.insert(unavailableReports).values({
    id: uuid(),
    listingId: id,
    ipHash,
    createdAt: new Date(),
  });

  // Increment counter
  await db
    .update(listings)
    .set({ unavailableCount: sql`${listings.unavailableCount} + 1` })
    .where(eq(listings.id, id));

  return NextResponse.json({ success: true }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings, flags } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { v4 as uuid } from "uuid";
import { rateLimit } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  // 10 flags per hour per IP
  const limited = rateLimit(request, {
    name: "flag",
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (limited) return limited;

  const { id } = await params;
  const body = await request.json();

  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  await db.insert(flags)
    .values({
      id: uuid(),
      listingId: id,
      reason: body.reason?.slice(0, 500)?.trim() || null,
      createdAt: new Date(),
    });

  await db.update(listings)
    .set({ flagCount: sql`${listings.flagCount} + 1` })
    .where(eq(listings.id, id));

  return NextResponse.json({ success: true }, { status: 201 });
}

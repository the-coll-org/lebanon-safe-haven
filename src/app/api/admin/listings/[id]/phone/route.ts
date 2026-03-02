import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";

const PHONE_REGEX = /^\+?[\d\s\-/]{7,20}$/;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (session.role !== "superadmin" && session.region !== listing.region) {
    return NextResponse.json(
      { error: "You can only edit listings in your region" },
      { status: 403 }
    );
  }

  db.update(listings)
    .set({
      phone: cleanPhone,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(listings.id, id))
    .run();

  return NextResponse.json({ success: true });
}

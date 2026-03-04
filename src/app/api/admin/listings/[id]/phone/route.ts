import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { encryptPhone } from "@/lib/crypto";

const PHONE_REGEX = /^\d{8}$/;

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

  const cleanPhone = String(phone).trim().replace(/\D/g, "");
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

  if (session.role !== "superadmin" && session.region !== listing.region) {
    return NextResponse.json(
      { error: "You can only edit listings in your region" },
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

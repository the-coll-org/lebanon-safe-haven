import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";

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

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

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

  // Superadmins can verify any listing; municipality admins only their region
  if (session.role !== "superadmin" && session.region !== listing.region) {
    return NextResponse.json(
      { error: "You can only verify listings in your region" },
      { status: 403 }
    );
  }

  db.update(listings)
    .set({
      verified: true,
      verifiedBy: session.id,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(listings.id, id))
    .run();

  return NextResponse.json({ success: true });
}

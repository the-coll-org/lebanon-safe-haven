import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { validateOrigin } from "@/lib/csrf";
import { createLog } from "@/lib/logging";

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

  const result = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
  const listing = result[0];

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

  await db.update(listings)
    .set({
      verified: true,
      verifiedBy: session.id,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, id));

  // Log verification
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
  await createLog({
    action: "verify",
    entityType: "listing",
    entityId: id,
    userId: session.id,
    userName: session.name,
    details: `Verified shelter listing in ${listing.region}`,
    ipAddress,
    userAgent: request.headers.get("user-agent") || undefined,
  });

  return NextResponse.json({ success: true });
}

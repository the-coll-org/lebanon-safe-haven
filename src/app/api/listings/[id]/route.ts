import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateOrigin } from "@/lib/csrf";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  return NextResponse.json(listing);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const csrf = validateOrigin(request);
  if (csrf) return csrf;

  const { id } = await params;
  const body = await request.json();
  const { editToken, status, description, capacity } = body;

  if (!editToken) {
    return NextResponse.json(
      { error: "Edit token is required" },
      { status: 401 }
    );
  }

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.editToken !== editToken) {
    return NextResponse.json({ error: "Invalid edit token" }, { status: 403 });
  }

  const validStatuses = ["available", "limited", "full"];
  const updates: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (status && validStatuses.includes(status)) updates.status = status;
  if (description !== undefined)
    updates.description = description
      ? String(description).slice(0, 1000).trim()
      : null;
  if (capacity !== undefined) {
    const cap = Number(capacity);
    if (Number.isInteger(cap) && cap >= 1 && cap <= 10000)
      updates.capacity = cap;
  }

  db.update(listings).set(updates).where(eq(listings.id, id)).run();

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = request.nextUrl;
  const editToken = searchParams.get("editToken");

  if (!editToken) {
    return NextResponse.json(
      { error: "Edit token is required" },
      { status: 401 }
    );
  }

  const listing = db.select().from(listings).where(eq(listings.id, id)).get();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }

  if (listing.editToken !== editToken) {
    return NextResponse.json({ error: "Invalid edit token" }, { status: 403 });
  }

  db.delete(listings).where(eq(listings.id, id)).run();

  return NextResponse.json({ success: true });
}

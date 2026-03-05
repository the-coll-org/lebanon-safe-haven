import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/db";
import { municipalities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { getAdminEmailEntry } from "@/lib/auth";

const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

interface ClerkWebhookEvent {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
      id: string;
    }>;
    first_name: string | null;
    last_name: string | null;
    primary_email_address_id: string;
  };
  type: string;
}

export async function POST(request: NextRequest) {
  if (!CLERK_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Clerk webhook secret not configured" },
      { status: 500 }
    );
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "user.created" || event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name, primary_email_address_id } = event.data;

    const primaryEmail = email_addresses.find(
      (e) => e.id === primary_email_address_id
    )?.email_address;

    if (!primaryEmail) {
      return NextResponse.json({ error: "No primary email found" }, { status: 400 });
    }

    const name = `${first_name || ""} ${last_name || ""}`.trim() ||
      primaryEmail.split("@")[0];

    // Check if user exists in DB (seeded superadmin, CLI-created)
    const existingUser = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.email, primaryEmail.toLowerCase()))
      .limit(1);

    if (existingUser[0]) {
      // Link existing account to Clerk
      await db
        .update(municipalities)
        .set({ name, clerkId: id })
        .where(eq(municipalities.id, existingUser[0].id));
    } else {
      // Check ADMIN_EMAILS env var
      const envEntry = getAdminEmailEntry(primaryEmail);
      if (envEntry) {
        const username = primaryEmail.split("@")[0];
        await db.insert(municipalities).values({
          id: uuidv4(),
          name,
          email: primaryEmail.toLowerCase(),
          username,
          region: envEntry.region,
          role: "admin",
          clerkId: id,
          createdAt: new Date(),
        });
      }
      // If not in DB and not in ADMIN_EMAILS: do nothing (not authorized)
    }
  }

  if (event.type === "user.deleted") {
    const { id } = event.data;
    await db.delete(municipalities).where(eq(municipalities.clerkId, id));
  }

  return NextResponse.json({ success: true });
}

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { headers } from "next/headers";
import { db } from "@/db";
import { municipalities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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
    [key: string]: unknown;
  };
  object: string;
  type: string;
}

export async function POST(request: NextRequest) {
  if (!CLERK_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Clerk webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = (await headerPayload).get("svix-id");
  const svix_timestamp = (await headerPayload).get("svix-timestamp");
  const svix_signature = (await headerPayload).get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  let event: ClerkWebhookEvent;

  // Verify the payload with the headers
  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  // Handle the event
  const eventType = event.type;

  if (eventType === "user.created" || eventType === "user.updated") {
    const { id, email_addresses, first_name, last_name } = event.data;

    // Get primary email
    const primaryEmail = email_addresses?.[0]?.email_address;
    if (!primaryEmail) {
      return NextResponse.json(
        { error: "No email found" },
        { status: 400 }
      );
    }

    // Check if email is whitelisted
    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(primaryEmail.toLowerCase())) {
      return NextResponse.json(
        { error: "Email not whitelisted" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.email, primaryEmail))
      .limit(1);

    const name = first_name && last_name 
      ? `${first_name} ${last_name}` 
      : first_name || last_name || primaryEmail.split("@")[0];

    if (existingUser[0]) {
      // Update existing user with Clerk ID
      await db
        .update(municipalities)
        .set({
          name,
          googleId: id, // Using googleId field to store Clerk ID
        })
        .where(eq(municipalities.id, existingUser[0].id));
    } else {
      // Create new user
      const username = `${primaryEmail.split("@")[0]}_${Math.random()
        .toString(36)
        .slice(2, 6)}`;

      await db.insert(municipalities).values({
        id: uuidv4(),
        name,
        email: primaryEmail,
        username,
        region: "all",
        role: "municipality",
        googleId: id, // Using googleId field to store Clerk ID
        createdAt: new Date(),
      });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = event.data;

    // Delete user from our database
    await db
      .delete(municipalities)
      .where(eq(municipalities.googleId, id));
  }

  return NextResponse.json({ success: true });
}

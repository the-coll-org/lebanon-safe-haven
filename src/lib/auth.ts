import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/db";
import { municipalities } from "@/db/schema";
import { eq } from "drizzle-orm";

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  region: string;
  role: string;
  username: string;
}

export function isEmailWhitelisted(email: string): boolean {
  const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.toLowerCase());
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const result = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.clerkId, userId))
      .limit(1);

    const user = result[0];
    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      region: user.region,
      role: user.role,
      username: user.username,
    };
  } catch {
    return null;
  }
}

export async function syncUserWithDatabase(): Promise<SessionUser | null> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    // Find the primary email using primary_email_address_id
    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;
    if (!primaryEmail) return null;

    if (!isEmailWhitelisted(primaryEmail)) return null;

    // Check if user already exists by clerkId
    const byClerkId = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.clerkId, clerkUser.id))
      .limit(1);

    if (byClerkId[0]) {
      const u = byClerkId[0];
      return { id: u.id, name: u.name, email: u.email, region: u.region, role: u.role, username: u.username };
    }

    // Check if user exists by email (legacy account migration)
    const byEmail = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.email, primaryEmail))
      .limit(1);

    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      primaryEmail.split("@")[0];

    if (byEmail[0]) {
      // Link existing account to Clerk
      await db
        .update(municipalities)
        .set({ clerkId: clerkUser.id, name })
        .where(eq(municipalities.id, byEmail[0].id));

      const u = byEmail[0];
      return { id: u.id, name, email: u.email, region: u.region, role: u.role, username: u.username };
    }

    // Create new user
    const { v4: uuidv4 } = await import("uuid");
    const username = `${primaryEmail.split("@")[0]}_${Math.random().toString(36).slice(2, 6)}`;

    const id = uuidv4();
    await db.insert(municipalities).values({
      id,
      name,
      email: primaryEmail,
      username,
      region: "all",
      role: "municipality",
      clerkId: clerkUser.id,
      createdAt: new Date(),
    });

    return { id, name, email: primaryEmail, region: "all", role: "municipality", username };
  } catch {
    return null;
  }
}

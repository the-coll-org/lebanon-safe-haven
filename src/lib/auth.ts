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

/**
 * Parse ADMIN_EMAILS env var.
 * Format: "email:region,email:region" (e.g. "ngo@org.lb:south_lebanon,vol@org.lb:beirut")
 */
function getAdminEmailEntries(): Array<{ email: string; region: string }> {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [email, region] = entry.split(":");
      return { email: email.trim().toLowerCase(), region: region?.trim() || "all" };
    });
}

/**
 * Check if an email is authorized for admin access.
 * Returns the matching env entry if found in ADMIN_EMAILS.
 */
export function getAdminEmailEntry(email: string): { email: string; region: string } | null {
  const entries = getAdminEmailEntries();
  return entries.find((e) => e.email === email.toLowerCase()) || null;
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
  } catch (error) {
    console.error("[auth] getSession failed:", error);
    return null;
  }
}

/**
 * Sync a Clerk-authenticated user to the database.
 * - If user exists by clerkId: return them
 * - If user exists by email (seeded superadmin / CLI-created): link their Clerk account
 * - If email is in ADMIN_EMAILS: create with the env-specified region and "admin" role
 * - Otherwise: return null (not authorized — will show "not whitelisted" message)
 */
export async function syncUserWithDatabase(): Promise<SessionUser | null> {
  try {
    const clerkUser = await currentUser();
    if (!clerkUser) return null;

    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress;
    if (!primaryEmail) return null;

    // Already linked by clerkId?
    const byClerkId = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.clerkId, clerkUser.id))
      .limit(1);

    if (byClerkId[0]) {
      const u = byClerkId[0];
      return { id: u.id, name: u.name, email: u.email, region: u.region, role: u.role, username: u.username };
    }

    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() ||
      primaryEmail.split("@")[0];

    // Check DB by email (seeded superadmin, CLI-created admin)
    const byEmail = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.email, primaryEmail.toLowerCase()))
      .limit(1);

    if (byEmail[0]) {
      // Link existing DB account to Clerk
      await db
        .update(municipalities)
        .set({ clerkId: clerkUser.id, name })
        .where(eq(municipalities.id, byEmail[0].id));

      const u = byEmail[0];
      return { id: u.id, name, email: u.email, region: u.region, role: u.role, username: u.username };
    }

    // Check ADMIN_EMAILS env var
    const envEntry = getAdminEmailEntry(primaryEmail);
    if (envEntry) {
      const { v4: uuidv4 } = await import("uuid");
      const id = uuidv4();
      const username = primaryEmail.split("@")[0];

      await db.insert(municipalities).values({
        id,
        name,
        email: primaryEmail.toLowerCase(),
        username,
        region: envEntry.region,
        role: "admin",
        clerkId: clerkUser.id,
        createdAt: new Date(),
      });

      return { id, name, email: primaryEmail, region: envEntry.region, role: "admin", username };
    }

    // Not authorized — email not in DB and not in ADMIN_EMAILS
    return null;
  } catch (error) {
    console.error("[auth] syncUserWithDatabase failed:", error);
    return null;
  }
}

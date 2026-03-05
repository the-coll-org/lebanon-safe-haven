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

export async function getSession(): Promise<SessionUser | null> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return null;
    }

    // Find user in our database by Clerk ID (stored in googleId field)
    const result = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.googleId, userId))
      .limit(1);

    const user = result[0];
    if (!user) {
      return null;
    }

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

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function syncUserWithDatabase(): Promise<SessionUser | null> {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return null;
    }

    const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;
    if (!primaryEmail) {
      return null;
    }

    // Check if email is whitelisted
    const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(primaryEmail.toLowerCase())) {
      return null;
    }

    // Find or create user
    const existingUser = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.email, primaryEmail))
      .limit(1);

    const name = `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || 
                 primaryEmail.split("@")[0];

    if (existingUser[0]) {
      // Update with Clerk ID if not set
      if (!existingUser[0].googleId) {
        await db
          .update(municipalities)
          .set({ googleId: clerkUser.id })
          .where(eq(municipalities.id, existingUser[0].id));
      }

      return {
        id: existingUser[0].id,
        name: existingUser[0].name,
        email: existingUser[0].email,
        region: existingUser[0].region,
        role: existingUser[0].role,
        username: existingUser[0].username,
      };
    }

    // User doesn't exist in our database yet (webhook might not have fired)
    // Create them now
    const { v4: uuidv4 } = await import("uuid");
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
      googleId: clerkUser.id,
      createdAt: new Date(),
    });

    // Fetch the newly created user
    const newUser = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.email, primaryEmail))
      .limit(1);

    if (!newUser[0]) {
      return null;
    }

    return {
      id: newUser[0].id,
      name: newUser[0].name,
      email: newUser[0].email,
      region: newUser[0].region,
      role: newUser[0].role,
      username: newUser[0].username,
    };
  } catch {
    return null;
  }
}

export function isEmailWhitelisted(email: string): boolean {
  const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.toLowerCase());
}

// Legacy functions - kept for compatibility but now use Clerk
export async function createSession(municipalityId: string): Promise<void> {
  // Clerk handles session management automatically
  // This function is kept for API compatibility
  console.log("Session created via Clerk for user:", municipalityId);
}

export async function clearSession(): Promise<void> {
  // Clerk handles session management automatically
  // This function is kept for API compatibility
  console.log("Session cleared via Clerk");
}

export async function authenticateAdmin(
  username: string,
  password: string
): Promise<SessionUser | null> {
  // This function is no longer used with Clerk
  // Kept for backward compatibility
  console.warn("authenticateAdmin is deprecated, use Clerk authentication");
  return null;
}

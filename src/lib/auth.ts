import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/db";
import { municipalities } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

// HMAC secret: use env var in production, fallback for dev only
const HMAC_SECRET =
  process.env.SESSION_SECRET || "dev-only-change-in-production";

function signPayload(payload: string): string {
  const sig = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

function verifySignedPayload(signed: string): string | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;

  const payload = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);

  const expected = crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(payload)
    .digest("hex");

  // Timing-safe comparison to prevent timing attacks
  if (sig.length !== expected.length) return null;
  const sigBuf = Buffer.from(sig, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  return payload;
}

export async function authenticateAdmin(
  username: string,
  password: string
) {
  const result = await db
    .select()
    .from(municipalities)
    .where(eq(municipalities.username, username))
    .limit(1);
  
  const municipality = result[0];

  if (!municipality) {
    // Constant-time: still hash to prevent timing-based user enumeration
    await bcrypt.hash("dummy", 10);
    return null;
  }

  const valid = await bcrypt.compare(password, municipality.passwordHash);
  if (!valid) return null;

  return municipality;
}

export async function createSession(municipalityId: string) {
  const payload = Buffer.from(
    JSON.stringify({ id: municipalityId, ts: Date.now() })
  ).toString("base64");

  const signed = signPayload(payload);

  (await cookies()).set(SESSION_COOKIE, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return signed;
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const payload = verifySignedPayload(token);
    if (!payload) return null;

    const data = JSON.parse(Buffer.from(payload, "base64").toString());

    // Check session expiry
    if (Date.now() - data.ts > SESSION_MAX_AGE * 1000) return null;

    const result = await db
      .select()
      .from(municipalities)
      .where(eq(municipalities.id, data.id))
      .limit(1);
    
    const municipality = result[0];

    return municipality || null;
  } catch {
    return null;
  }
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer | null {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[SECURITY] ENCRYPTION_KEY is not set. Phone numbers are stored in plaintext. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
      );
    }
    return null;
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptPhone(phone: string): string {
  const key = getKey();
  if (!key) return phone; // No key = store plaintext

  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(phone, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

export function decryptPhone(value: string): string {
  // Not in encrypted format — return as-is (plaintext)
  const parts = value.split(":");
  if (parts.length !== 3) return value;

  const key = getKey();
  if (!key) return value; // No key = can't decrypt, return raw

  try {
    const iv = Buffer.from(parts[0], "hex");
    const tag = Buffer.from(parts[1], "hex");
    const data = parts[2];
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(data, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return value;
  }
}

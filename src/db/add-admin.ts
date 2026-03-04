/**
 * Add a new admin account.
 *
 * Usage:
 *   npx tsx src/db/add-admin.ts <username> <name> <region>
 *
 * Example:
 *   npx tsx src/db/add-admin.ts admin "Platform Admin" beirut
 *   npx tsx src/db/add-admin.ts tyre_admin "بلدية صور" south_lebanon
 *
 * A secure random password will be generated and printed.
 */

import { readFileSync } from "fs";
try {
  readFileSync(".env", "utf8").split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx > 0) process.env[trimmed.slice(0, idx).trim()] ??= trimmed.slice(idx + 1).trim();
  });
} catch {}

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { municipalities } from "./schema";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import crypto from "crypto";

const args = process.argv.slice(2);

if (args.length < 3) {
  console.error("Usage: npx tsx src/db/add-admin.ts <username> <name> <region>");
  console.error('Example: npx tsx src/db/add-admin.ts admin "Platform Admin" beirut');
  process.exit(1);
}

const [username, name, region] = args;

const connectionString = process.env.DATABASE_URL || `postgres://safehaven:safehaven@localhost:${process.env.DB_PORT || 5432}/safehaven`;
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function main() {
  const password = crypto.randomBytes(16).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);

  await db.insert(municipalities).values({
    id: uuid(),
    name,
    region,
    role: "municipality",
    username,
    passwordHash,
    createdAt: new Date(),
  });

  console.log(`\nAdmin account created:`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  console.log(`\n  ⚠  SAVE THIS PASSWORD — it cannot be recovered!\n`);
  await pool.end();
}

main().catch((err) => {
  console.error("Error creating admin account:");
  
  // Check for specific database errors
  if (err.message?.includes('unique constraint') || err.message?.includes('duplicate key')) {
    console.error(`  Username "${username}" already exists. Please choose a different username.`);
  } else if (err.message?.includes('connect') || err.code === 'ECONNREFUSED') {
    console.error("  Cannot connect to database. Please check if the database is running.");
  } else {
    console.error(" ", err.message);
  }
  
  // Log full error details for debugging
  if (err.code) {
    console.error(`  (Error code: ${err.code})`);
  }
  
  pool.end();
  process.exit(1);
});

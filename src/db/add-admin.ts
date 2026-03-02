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

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
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

const sqlite = new Database("./sqlite.db");
const db = drizzle(sqlite);

async function main() {
  const password = crypto.randomBytes(16).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);

  db.insert(municipalities)
    .values({
      id: uuid(),
      name,
      region,
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
    })
    .run();

  console.log(`\nAdmin account created:`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  console.log(`\n  ⚠  SAVE THIS PASSWORD — it cannot be recovered!\n`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  sqlite.close();
  process.exit(1);
});

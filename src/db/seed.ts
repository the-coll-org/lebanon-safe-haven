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

const connectionString = process.env.DATABASE_URL || `postgres://safehaven:safehaven@localhost:${process.env.DB_PORT || 5432}/safehaven`;

const pool = new Pool({ connectionString });
const db = drizzle(pool);

function generatePassword(): string {
  return crypto.randomBytes(12).toString("base64url");
}

async function seed() {
  const superAdminEmail = process.argv[2];
  if (!superAdminEmail || !superAdminEmail.includes("@")) {
    console.error("Usage: npx tsx src/db/seed.ts <superadmin-email>");
    console.error("Example: npx tsx src/db/seed.ts admin@thecoll.org");
    process.exit(1);
  }

  console.log("Seeding database...\n");

  // Super-admin (platform-wide access, all regions)
  const superAdminPassword = generatePassword();
  const superAdminHash = await bcrypt.hash(superAdminPassword, 10);
  await db.insert(municipalities).values({
    id: uuid(),
    name: "Platform Admin",
    email: superAdminEmail.toLowerCase(),
    region: "all",
    role: "superadmin",
    username: "admin",
    passwordHash: superAdminHash,
    createdAt: new Date(),
  });
  console.log(`  Super admin created:`);
  console.log(`    Email: ${superAdminEmail}`);
  console.log(`    Username: admin`);
  console.log(`    Password: ${superAdminPassword} (legacy — use Clerk to sign in)`);
  console.log();

  // Municipality accounts — one per region
  const demoMunicipalities = [
    { name: "بلدية بيروت", region: "beirut", username: "beirut_admin" },
    { name: "بلدية جبل لبنان", region: "mount_lebanon", username: "mount_lebanon_admin" },
    { name: "بلدية الجنوب", region: "south_lebanon", username: "south_lebanon_admin" },
    { name: "بلدية النبطية", region: "nabatieh", username: "nabatieh_admin" },
    { name: "بلدية البقاع", region: "bekaa", username: "bekaa_admin" },
    { name: "بلدية بعلبك", region: "baalbek_hermel", username: "baalbek_admin" },
    { name: "بلدية عكار", region: "akkar", username: "akkar_admin" },
    { name: "بلدية الشمال", region: "north_lebanon", username: "north_admin" },
  ];

  console.log("  Municipality accounts:");
  for (const m of demoMunicipalities) {
    const password = generatePassword();
    const passwordHash = await bcrypt.hash(password, 10);
    await db.insert(municipalities).values({
      id: uuid(),
      name: m.name,
      region: m.region,
      username: m.username,
      passwordHash,
      createdAt: new Date(),
    });
    console.log(`    ${m.username} / ${password}`);
  }

  console.log("\n  ⚠  SAVE THESE PASSWORDS — they cannot be recovered!\n");
  console.log("Seed complete!");
  await pool.end();
}

seed().catch(console.error);

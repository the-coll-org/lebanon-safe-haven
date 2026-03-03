import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { municipalities } from "../src/db/schema";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import crypto from "crypto";

const connectionString = process.env.DATABASE_URL || "postgres://safehaven:safehaven@localhost:5432/safehaven";
const pool = new Pool({ connectionString });
const db = drizzle(pool);

async function main() {
  const username = process.argv[2] || "testadmin";
  const name = process.argv[3] || "Test Admin";
  const region = process.argv[4] || "beirut";
  
  console.log(`Creating admin: ${username} (${name}) in ${region}`);
  
  const password = crypto.randomBytes(16).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);
  
  console.log("Password hash:", passwordHash);
  
  try {
    const result = await db.insert(municipalities).values({
      id: uuid(),
      name,
      region,
      role: "municipality",
      username,
      passwordHash,
      createdAt: new Date(),
    }).returning();
    
    console.log("\n✅ Admin account created successfully!");
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${password}`);
    console.log(`  ID: ${result[0]?.id}`);
    console.log("\n  ⚠️  SAVE THIS PASSWORD — it cannot be recovered!\n");
  } catch (err: any) {
    console.error("\n❌ ERROR creating admin:");
    console.error("  Message:", err.message);
    console.error("  Code:", err.code);
    if (err.detail) console.error("  Detail:", err.detail);
    if (err.constraint) console.error("  Constraint:", err.constraint);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

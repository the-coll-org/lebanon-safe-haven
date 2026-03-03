#!/usr/bin/env tsx
/**
 * Migration script: SQLite to PostgreSQL
 * 
 * This script migrates data from the old SQLite database to the new PostgreSQL database.
 * Run this after starting the PostgreSQL container but before using the app.
 * 
 * Usage:
 *   1. Start the PostgreSQL container: docker compose up -d db
 *   2. Run this script: npx tsx scripts/migrate-sqlite-to-postgres.ts
 *   3. Start the app: docker compose up -d app
 */

import Database from "better-sqlite3";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { listings, municipalities, flags, feedback } from "../src/db/schema";

const SQLITE_PATH = process.env.SQLITE_PATH || "./data/sqlite.db";
const DATABASE_URL = process.env.DATABASE_URL || "postgres://safehaven:safehaven@localhost:5432/safehaven";

async function migrate() {
  console.log("==> Starting migration from SQLite to PostgreSQL");
  
  // Connect to SQLite
  console.log(`==> Connecting to SQLite: ${SQLITE_PATH}`);
  const sqlite = new Database(SQLITE_PATH);
  
  // Connect to PostgreSQL
  console.log(`==> Connecting to PostgreSQL`);
  const pool = new Pool({ connectionString: DATABASE_URL });
  const pg = drizzle(pool);
  
  try {
    // Migrate municipalities first (referenced by other tables)
    console.log("==> Migrating municipalities...");
    const muniRows = sqlite.prepare("SELECT * FROM municipalities").all() as any[];
    if (muniRows.length > 0) {
      await pg.insert(municipalities).values(
        muniRows.map(row => ({
          id: row.id,
          name: row.name,
          region: row.region,
          role: row.role,
          username: row.username,
          passwordHash: row.password_hash,
          createdAt: new Date(row.created_at),
        }))
      );
    }
    console.log(`    Migrated ${muniRows.length} municipalities`);
    
    // Migrate listings
    console.log("==> Migrating listings...");
    const listingRows = sqlite.prepare("SELECT * FROM listings").all() as any[];
    if (listingRows.length > 0) {
      await pg.insert(listings).values(
        listingRows.map(row => ({
          id: row.id,
          phone: row.phone,
          region: row.region,
          category: row.category,
          area: row.area,
          capacity: row.capacity,
          description: row.description,
          status: row.status,
          editToken: row.edit_token,
          verified: Boolean(row.verified),
          verifiedBy: row.verified_by,
          flagCount: row.flag_count,
          latitude: row.latitude,
          longitude: row.longitude,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
        }))
      );
    }
    console.log(`    Migrated ${listingRows.length} listings`);
    
    // Migrate flags
    console.log("==> Migrating flags...");
    const flagRows = sqlite.prepare("SELECT * FROM flags").all() as any[];
    if (flagRows.length > 0) {
      await pg.insert(flags).values(
        flagRows.map(row => ({
          id: row.id,
          listingId: row.listing_id,
          reason: row.reason,
          createdAt: new Date(row.created_at),
        }))
      );
    }
    console.log(`    Migrated ${flagRows.length} flags`);
    
    // Migrate feedback
    console.log("==> Migrating feedback...");
    const feedbackRows = sqlite.prepare("SELECT * FROM feedback").all() as any[];
    if (feedbackRows.length > 0) {
      await pg.insert(feedback).values(
        feedbackRows.map(row => ({
          id: row.id,
          name: row.name,
          email: row.email,
          message: row.message,
          category: row.category,
          userType: row.user_type,
          municipalityId: row.municipality_id,
          createdAt: new Date(row.created_at),
        }))
      );
    }
    console.log(`    Migrated ${feedbackRows.length} feedback entries`);
    
    console.log("==> Migration completed successfully!");
    
  } catch (error) {
    console.error("==> Migration failed:", error);
    process.exit(1);
  } finally {
    sqlite.close();
    await pool.end();
  }
}

migrate();

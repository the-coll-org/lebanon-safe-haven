import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const listings = sqliteTable("listings", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  region: text("region").notNull(),
  category: text("category").notNull().default("shelter"),
  area: text("area"),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  status: text("status").notNull().default("available"),
  editToken: text("edit_token").notNull(),
  verified: integer("verified", { mode: "boolean" }).notNull().default(false),
  verifiedBy: text("verified_by"),
  flagCount: integer("flag_count").notNull().default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const municipalities = sqliteTable("municipalities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  region: text("region").notNull(),
  role: text("role").notNull().default("municipality"),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const flags = sqliteTable("flags", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id),
  reason: text("reason"),
  createdAt: text("created_at").notNull(),
});

import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";

export const listings = pgTable("listings", {
  id: text("id").primaryKey(),
  phone: text("phone").notNull(),
  region: text("region").notNull(),
  category: text("category").notNull().default("shelter"),
  area: text("area"),
  capacity: integer("capacity").notNull(),
  description: text("description"),
  status: text("status").notNull().default("available"),
  editToken: text("edit_token").notNull(),
  verified: boolean("verified").notNull().default(false),
  verifiedBy: text("verified_by"),
  flagCount: integer("flag_count").notNull().default(0),
  latitude: real("latitude"),
  longitude: real("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});

export const municipalities = pgTable("municipalities", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").unique(),
  region: text("region").notNull(),
  role: text("role").notNull().default("municipality"),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const flags = pgTable("flags", {
  id: text("id").primaryKey(),
  listingId: text("listing_id")
    .notNull()
    .references(() => listings.id, { onDelete: "cascade" }),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  message: text("message").notNull(),
  category: text("category").notNull().default("general"),
  userType: text("user_type").notNull().default("guest"),
  municipalityId: text("municipality_id").references(() => municipalities.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const adminLogs = pgTable("admin_logs", {
  id: text("id").primaryKey(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  userId: text("user_id").references(() => municipalities.id, { onDelete: "set null" }),
  userName: text("user_name"),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

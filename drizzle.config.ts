import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || `postgres://safehaven:safehaven@localhost:${process.env.DB_PORT || 5432}/safehaven`,
  },
});

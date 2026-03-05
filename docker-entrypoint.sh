#!/bin/sh
set -e

echo "==> The Haven startup"

# Wait for PostgreSQL to be ready
echo "==> Waiting for PostgreSQL..."
until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-safehaven}"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "==> PostgreSQL is ready!"

# Apply schema (idempotent)
echo "==> Running database migrations..."
cd /app && npx drizzle-kit push

# Seed admin accounts only on first run (check if municipalities table has data)
SEED_COUNT=$(npx tsx -e "
import { db } from './src/db/index.js';
import { municipalities } from './src/db/schema.js';
import { count } from 'drizzle-orm';
const result = await db.select({ count: count() }).from(municipalities);
console.log(result[0].count);
process.exit(0);
" 2>/dev/null || echo "0")

if [ "$SEED_COUNT" = "0" ]; then
    if [ -z "$SUPERADMIN_EMAIL" ]; then
        echo "==> WARNING: No SUPERADMIN_EMAIL set. Skipping seed. Set SUPERADMIN_EMAIL to create the initial superadmin."
    else
        echo "==> Seeding database — SAVE THE CREDENTIALS PRINTED BELOW"
        npx tsx src/db/seed.ts "$SUPERADMIN_EMAIL"
    fi
fi

echo "==> Starting Next.js..."
exec "$@"

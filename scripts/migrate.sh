#!/bin/bash
# SQLite to PostgreSQL migration script for Docker environments

set -e

echo "==> SQLite to PostgreSQL Migration"

# Check if SQLite database exists
if [ ! -f "./data/sqlite.db" ]; then
    echo "ERROR: SQLite database not found at ./data/sqlite.db"
    exit 1
fi

# Start only the database container
echo "==> Starting PostgreSQL container..."
docker compose up -d db

# Wait for PostgreSQL to be ready
echo "==> Waiting for PostgreSQL to be ready..."
sleep 5
docker compose exec db pg_isready -U safehaven -d safehaven

# Create a temporary container to run the migration
echo "==> Running migration..."
docker run --rm \
    --network lebanon-safe-haven_default \
    -v "$(pwd):/app" \
    -v "$(pwd)/data:/data" \
    -e DATABASE_URL="postgres://safehaven:safehaven@db:5432/safehaven" \
    -e SQLITE_PATH="/data/sqlite.db" \
    -w /app \
    node:20-alpine \
    sh -c "
        apk add --no-cache postgresql-client python3 make g++
        npm install
        npx tsx scripts/migrate-sqlite-to-postgres.ts
    "

echo "==> Migration complete!"
echo ""
echo "You can now start the full application:"
echo "  docker compose up -d"

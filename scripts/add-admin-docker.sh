#!/bin/bash
# Add admin user to PostgreSQL database in Docker

if [ $# -lt 3 ]; then
    echo "Usage: $0 <username> <name> <region>"
    echo "Example: $0 admin2 'New Admin' beirut"
    exit 1
fi

USERNAME="$1"
NAME="$2"
REGION="$3"

echo "==> Creating admin: $USERNAME"

# First-time setup: install dependencies to a persistent volume
if [ ! -f .admin-deps-installed ]; then
    echo "==> First run: installing dependencies (this will take a few minutes)..."
    docker run --rm \
        -v "$(pwd)/.admin-deps:/app" \
        -w /app \
        node:20-alpine \
        sh -c "apk add --no-cache postgresql-client python3 make g++ > /dev/null && npm install pg drizzle-orm bcryptjs uuid drizzle-kit tsx @types/pg @types/bcryptjs @types/uuid > /dev/null 2>&1 && touch .done"
    touch .admin-deps-installed
    echo "==> Dependencies installed!"
fi

# Run the admin creation using the pre-installed dependencies
docker run --rm \
    --network lebanon-safe-haven_default \
    -v "$(pwd):/app" \
    -v "$(pwd)/.admin-deps/node_modules:/app/node_modules" \
    -v "$(pwd)/.admin-deps/package.json:/app/package.json" \
    -v "$(pwd)/.admin-deps/package-lock.json:/app/package-lock.json" \
    -e DATABASE_URL="postgres://safehaven:safehaven@db:5432/safehaven" \
    -w /app \
    node:20-alpine \
    npx tsx src/db/add-admin.ts "$USERNAME" "$NAME" "$REGION"

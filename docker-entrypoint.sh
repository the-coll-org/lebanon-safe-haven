#!/bin/sh
set -e

echo "==> Safe Haven startup"

# Ensure persistent data dir exists
mkdir -p /data

# If a real (non-symlink) sqlite.db exists in /app (e.g. from a previous run
# without volumes), move it to /data so it isn't lost.
if [ -f /app/sqlite.db ] && [ ! -L /app/sqlite.db ]; then
    if [ ! -f /data/sqlite.db ]; then
        echo "==> Moving existing sqlite.db to /data/"
        mv /app/sqlite.db /data/sqlite.db
    else
        rm /app/sqlite.db
    fi
fi

# Symlink /app/sqlite.db -> /data/sqlite.db so the app code finds it
if [ ! -L /app/sqlite.db ]; then
    ln -s /data/sqlite.db /app/sqlite.db
fi

# Detect fresh database before migrations create the file
IS_NEW=0
[ ! -f /data/sqlite.db ] && IS_NEW=1

# Apply schema (idempotent)
echo "==> Running database migrations..."
cd /app && npx drizzle-kit push

# Seed admin accounts only on first run
if [ "$IS_NEW" = "1" ]; then
    echo "==> Seeding database — SAVE THE PASSWORDS PRINTED BELOW"
    npm run db:seed
fi

echo "==> Starting Next.js..."
exec "$@"

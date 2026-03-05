#!/bin/bash
set -e

echo "=== The Haven Deployment ==="
echo "Domain: safehaven.thecoll.org"
echo ""

# Check for required environment variables
if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  SESSION_SECRET not set. Generating a random one..."
    export SESSION_SECRET=$(openssl rand -hex 32)
    echo "SESSION_SECRET=$SESSION_SECRET"
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "⚠️  ENCRYPTION_KEY not set. Generating a random one..."
    export ENCRYPTION_KEY=$(openssl rand -hex 32)
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
fi

# Create data directory
mkdir -p data

echo ""
echo "=== Building Docker image ==="
docker compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "=== Starting services ==="
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Deployment complete! ==="
echo ""
echo "View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "Stop: docker compose -f docker-compose.prod.yml down"
echo ""
echo "⚠️  IMPORTANT: Save the admin passwords shown above!"
echo "   They are only displayed once during initial database seeding."

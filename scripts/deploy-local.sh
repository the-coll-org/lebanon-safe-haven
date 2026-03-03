#!/bin/bash
set -e

# Local deployment script (for manual deploys without CI/CD)
# Use this if you're not using GitHub Actions

echo "🚀 Safe Haven Local Deployment"
echo "==============================="
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | xargs)
fi

# Check for required environment variables
if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  SESSION_SECRET not set. Generating a random one..."
    export SESSION_SECRET=$(openssl rand -hex 32)
    echo "SESSION_SECRET=$SESSION_SECRET" >> .env
fi

if [ -z "$ENCRYPTION_KEY" ]; then
    echo "⚠️  ENCRYPTION_KEY not set. Generating a random one..."
    export ENCRYPTION_KEY=$(openssl rand -hex 32)
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY" >> .env
fi

# Create data directory
mkdir -p data
chmod 755 data

echo ""
echo "=== Building Docker image ==="
docker-compose -f docker-compose.prod.yml build --no-cache

echo ""
echo "=== Starting services ==="
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "=== Deployment complete! ==="
echo ""
echo "🔗 URL: http://localhost:3000"
echo "📊 Logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "🛑 Stop: docker-compose -f docker-compose.prod.yml down"
echo ""

# Wait for health check
echo "⏳ Waiting for health check..."
sleep 5
if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Application is healthy!"
else
    echo "⚠️  Application may still be starting. Check logs for details."
fi

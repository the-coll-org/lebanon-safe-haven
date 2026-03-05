#!/bin/bash
# Check deployment status - shows if latest push is live

set -e

echo "🔍 Checking Deployment Status"
echo "=============================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current git info
if [ -d ".git" ]; then
    GIT_COMMIT=$(git rev-parse --short HEAD)
    GIT_BRANCH=$(git branch --show-current)
    GIT_MSG=$(git log -1 --pretty=%s)
    echo "📦 Local Repository:"
    echo "   Commit: $GIT_COMMIT"
    echo "   Branch: $GIT_BRANCH"
    echo "   Message: $GIT_MSG"
    echo ""
fi

# Check if running in Docker
if [ -f "/.dockerenv" ]; then
    echo "ℹ️  Running inside Docker container"
    echo ""
fi

# Check running container
if command -v docker &> /dev/null; then
    echo "🐳 Docker Status:"
    
    # Check if container is running
    CONTAINER_ID=$(docker ps -q --filter "name=the-haven" --filter "name=app" 2>/dev/null | head -1)
    
    if [ -n "$CONTAINER_ID" ]; then
        CONTAINER_NAME=$(docker ps --format "{{.Names}}" --filter "id=$CONTAINER_ID")
        CONTAINER_IMAGE=$(docker ps --format "{{.Image}}" --filter "id=$CONTAINER_ID")
        CONTAINER_STATUS=$(docker ps --format "{{.Status}}" --filter "id=$CONTAINER_ID")
        CONTAINER_CREATED=$(docker ps --format "{{.CreatedAt}}" --filter "id=$CONTAINER_ID")
        
        echo -e "   Status: ${GREEN}Running${NC}"
        echo "   Container: $CONTAINER_NAME"
        echo "   Image: $CONTAINER_IMAGE"
        echo "   Uptime: $CONTAINER_STATUS"
        echo "   Created: $CONTAINER_CREATED"
        
        # Extract commit SHA from image tag if available
        if [[ "$CONTAINER_IMAGE" =~ :([a-f0-9]+)$ ]]; then
            DEPLOYED_COMMIT="${BASH_REMATCH[1]}"
            echo "   Deployed Commit: $DEPLOYED_COMMIT"
            
            if [ -n "$GIT_COMMIT" ] && [ "$DEPLOYED_COMMIT" = "$GIT_COMMIT" ]; then
                echo -e "   ${GREEN}✅ Latest commit is deployed!${NC}"
            else
                echo -e "   ${YELLOW}⚠️  Container is running an older version${NC}"
            fi
        fi
    else
        echo -e "   Status: ${RED}Not Running${NC}"
        
        # Check if container exists but is stopped
        STOPPED=$(docker ps -aq --filter "name=the-haven" --filter "name=app" 2>/dev/null | head -1)
        if [ -n "$STOPPED" ]; then
            echo "   Container exists but is stopped"
            echo "   Last exit code: $(docker inspect --format='{{.State.ExitCode}}' $STOPPED)"
        fi
    fi
    echo ""
fi

# Health check
echo "🏥 Health Check:"
HEALTH_URL="http://localhost:3000/api/health"
HEALTH_RESPONSE=$(curl -sf "$HEALTH_URL" 2>/dev/null) || true

if [ -n "$HEALTH_RESPONSE" ]; then
    STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    TIMESTAMP=$(echo "$HEALTH_RESPONSE" | grep -o '"timestamp":"[^"]*"' | cut -d'"' -f4)
    UPTIME=$(echo "$HEALTH_RESPONSE" | grep -o '"uptime":[0-9.]*' | cut -d':' -f2)
    
    if [ "$STATUS" = "healthy" ]; then
        echo -e "   Status: ${GREEN}Healthy${NC}"
    else
        echo -e "   Status: ${RED}Unhealthy ($STATUS)${NC}"
    fi
    echo "   Server Time: $TIMESTAMP"
    echo "   Uptime: $(printf '%.0f' ${UPTIME:-0}) seconds"
else
    echo -e "   Status: ${RED}No response from $HEALTH_URL${NC}"
    echo "   Is the application running?"
fi
echo ""

# GitHub Actions status (if gh CLI is available)
if command -v gh &> /dev/null && [ -d ".git" ]; then
    echo "🔄 Latest GitHub Actions Run:"
    gh run list --limit 1 --json conclusion,status,createdAt,headSha,url 2>/dev/null | \
        jq -r '.[] | "   Status: \(.status) (\(.conclusion // "in progress"))\n   Created: \(.createdAt)\n   Commit: \(.headSha[:7])\n   URL: \(.url)"' || \
        echo "   Could not fetch GitHub Actions status"
    echo ""
fi

echo "=============================="
echo ""
echo "📚 Useful commands:"
echo "   View logs:     docker-compose -f docker-compose.prod.yml logs -f"
echo "   Restart:       docker-compose -f docker-compose.prod.yml restart"
echo "   Full check:    docker ps && curl http://localhost:3000/api/health"

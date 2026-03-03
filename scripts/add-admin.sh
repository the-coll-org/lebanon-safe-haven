#!/bin/bash
# Add admin user script for Docker environments
# Usage: ./scripts/add-admin.sh <username> <name> <region>
# Example: ./scripts/add-admin.sh new_admin "New Administrator" beirut

set -e

if [ $# -lt 3 ]; then
    echo "Usage: $0 <username> <name> <region>"
    echo "Example: $0 new_admin \"New Administrator\" beirut"
    echo ""
    echo "Valid regions: beirut, mount_lebanon, south_lebanon, nabatieh, bekaa, baalbek_hermel, akkar, north_lebanon"
    exit 1
fi

USERNAME=$1
NAME=$2
REGION=$3

echo "==> Adding admin user: $USERNAME"

# Run the add-admin script in a temporary container
docker run --rm \
    --network lebanon-safe-haven_default \
    -v "$(pwd):/app" \
    -e DATABASE_URL="postgres://safehaven:safehaven@db:5432/safehaven" \
    -w /app \
    node:20-alpine \
    sh -c "
        apk add --no-cache postgresql-client python3 make g++ > /dev/null 2>&1
        npm install > /dev/null 2>&1
        npx tsx src/db/add-admin.ts '$USERNAME' '$NAME' '$REGION'
    "

echo "==> Done!"

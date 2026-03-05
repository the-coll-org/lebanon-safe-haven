#!/bin/bash
# The Haven Deployment Test Script

echo "========================================="
echo "The Haven Deployment Test"
echo "Domain: safehaven.thecoll.org"
echo "========================================="
echo ""

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASSED=0
FAILED=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local expected="${3:-200}"
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    if [ "$STATUS" = "$expected" ]; then
        echo "✅ $name ($STATUS)"
        ((PASSED++))
    else
        echo "❌ $name (expected $expected, got $STATUS)"
        ((FAILED++))
    fi
}

echo "=== FRONTEND PAGES ==="
test_endpoint "Landing (AR)" "$BASE_URL/ar"
test_endpoint "Landing (EN)" "$BASE_URL/en"
test_endpoint "Listings" "$BASE_URL/ar/listings"
test_endpoint "Offer Form" "$BASE_URL/ar/offer"
test_endpoint "Hotlines" "$BASE_URL/ar/hotlines"
test_endpoint "Resources" "$BASE_URL/ar/resources"
test_endpoint "Admin Login" "$BASE_URL/ar/admin/login"

echo ""
echo "=== API ENDPOINTS ==="

# Create listing
CREATE_RESP=$(curl -s -X POST "$BASE_URL/api/listings" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+96170123456","region":"beirut","category":"food","area":"Test Area","capacity":2,"description":"Test listing"}')
LISTING_ID=$(echo "$CREATE_RESP" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$LISTING_ID" ]; then
    echo "✅ Create listing ($LISTING_ID)"
    ((PASSED++))
else
    echo "❌ Create listing"
    ((FAILED++))
fi

# Get listings
test_endpoint "Get all listings" "$BASE_URL/api/listings" 200

# Get single listing
test_endpoint "Get single listing" "$BASE_URL/api/listings/$LISTING_ID" 200

# Filter by region
FILTER=$(curl -s "$BASE_URL/api/listings?region=beirut")
if echo "$FILTER" | grep -q "$LISTING_ID"; then
    echo "✅ Filter by region"
    ((PASSED++))
else
    echo "❌ Filter by region"
    ((FAILED++))
fi

echo ""
echo "=== SUMMARY ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo "🎉 All tests passed!"
    exit 0
else
    echo ""
    echo "⚠️  Some tests failed"
    exit 1
fi

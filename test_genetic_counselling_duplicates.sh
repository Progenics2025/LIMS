#!/bin/bash

echo "=========================================="
echo "Testing Genetic Counselling Duplicate Fix"
echo "=========================================="
echo ""

echo "Issue: Creating 1 record resulted in 3 duplicate entries"
echo "Root Cause: Race condition between manual state update and React Query refetch"
echo "Fix: Removed manual state updates, let React Query handle all updates"
echo ""

# Count current records
BEFORE_COUNT=$(curl -s http://localhost:4000/api/genetic-counselling-sheet | jq 'length')
echo "Records before test: $BEFORE_COUNT"
echo ""

echo "Test 1: Create a single record"
echo "==============================="
echo ""

TEST_UNIQUE_ID="GC_DUPE_TEST_$(date +%s)"

CREATE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/genetic-counselling-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "'"$TEST_UNIQUE_ID"'",
    "project_id": "PG_GC_TEST_001",
    "patient_client_name": "Duplicate Test Patient",
    "age": 35,
    "gender": "Male",
    "gc_name": "Test GC",
    "counseling_type": "Pre-test",
    "service_name": "WGS"
  }')

CREATED_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
echo "✓ Record created with ID: $CREATED_ID"
echo "  Unique ID: $TEST_UNIQUE_ID"
echo ""

echo "Waiting 2 seconds for any async operations..."
sleep 2

echo ""
echo "Test 2: Check for duplicates"
echo "============================="
echo ""

DUPLICATES=$(curl -s http://localhost:4000/api/genetic-counselling-sheet | \
  jq --arg uid "$TEST_UNIQUE_ID" '[.[] | select(.unique_id == $uid)]')

DUPE_COUNT=$(echo "$DUPLICATES" | jq 'length')

echo "Records found with unique_id '$TEST_UNIQUE_ID': $DUPE_COUNT"
echo ""

if [ "$DUPE_COUNT" == "1" ]; then
  echo "✅ SUCCESS! Only 1 record created (no duplicates)"
  echo ""
  echo "Record details:"
  echo "$DUPLICATES" | jq '.[0] | {
    id,
    unique_id,
    project_id,
    patient_client_name,
    gc_name,
    counseling_type
  }'
elif [ "$DUPE_COUNT" == "3" ]; then
  echo "❌ FAILED! Still creating 3 duplicates"
  echo ""
  echo "Duplicate IDs found:"
  echo "$DUPLICATES" | jq -r '.[].id'
  echo ""
  echo "This means the frontend fix hasn't been applied yet."
  echo "Make sure the browser has reloaded the latest code."
else
  echo "⚠️  UNEXPECTED! Found $DUPE_COUNT records (expected 1)"
  echo ""
  echo "IDs found:"
  echo "$DUPLICATES" | jq -r '.[].id'
fi
echo ""

AFTER_COUNT=$(curl -s http://localhost:4000/api/genetic-counselling-sheet | jq 'length')
ADDED_COUNT=$((AFTER_COUNT - BEFORE_COUNT))

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo "Records before: $BEFORE_COUNT"
echo "Records after:  $AFTER_COUNT"
echo "Records added:  $ADDED_COUNT"
echo ""

if [ "$ADDED_COUNT" == "1" ]; then
  echo "✅ Perfect! Only 1 record added as expected"
elif [ "$ADDED_COUNT" == "3" ]; then
  echo "❌ Problem persists! 3 records added instead of 1"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Clear browser cache and reload"
  echo "2. Check browser console for errors"
  echo "3. Verify the fix was applied to GeneticCounselling.tsx"
  echo "4. Check if Vite dev server has recompiled the file"
else
  echo "⚠️  Unexpected result: $ADDED_COUNT records added"
fi
echo ""

echo "Test 3: Cleanup"
echo "==============="
echo ""
read -p "Delete test record(s)? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  # Get all IDs with this unique_id
  IDS=$(curl -s http://localhost:4000/api/genetic-counselling-sheet | \
    jq -r --arg uid "$TEST_UNIQUE_ID" '.[] | select(.unique_id == $uid) | .id')
  
  for ID in $IDS; do
    curl -s -X DELETE http://localhost:4000/api/genetic-counselling-sheet/$ID > /dev/null
    echo "Deleted record ID: $ID"
  done
  echo ""
  echo "✓ Test records cleaned up"
else
  echo "Test records kept (unique_id: $TEST_UNIQUE_ID)"
fi
echo ""

echo "=========================================="
echo "What was fixed?"
echo "=========================================="
echo ""
echo "BEFORE (causing duplicates):"
echo "  1. POST request creates record"
echo "  2. Manually add record to state: setRows([new, ...old])"
echo "  3. Invalidate query cache → triggers refetch"
echo "  4. useEffect runs → setRows(serverData) adds it again"
echo "  5. Result: 2-3 duplicate entries"
echo ""
echo "AFTER (fixed):"
echo "  1. POST request creates record"
echo "  2. Invalidate query cache → triggers refetch"
echo "  3. useEffect runs → setRows(serverData) adds it once"
echo "  4. Result: 1 entry only"
echo ""
echo "The fix removes manual state manipulation and lets"
echo "React Query handle all state updates automatically."
echo ""

#!/bin/bash

# Simple test to verify GC duplicate fix is working
# This creates a lead, converts it, and verifies only 1 GC record exists

BASE_URL="http://localhost:4000"
TEST_ID="GCTEST_$(date +%s)"

echo "========================================="
echo "GC Duplicate Fix Verification Test"
echo "========================================="
echo "Test Unique ID: $TEST_ID"
echo ""

# Step 1: Create lead with geneticCounselorRequired=true
echo "Step 1: Creating lead with GC required..."
curl -s -X POST "$BASE_URL/api/leads" \
  -H "Content-Type: application/json" \
  -d "{
    \"uniqueId\": \"$TEST_ID\",
    \"projectId\": \"PG_TEST\",
    \"patientClientName\": \"Test Patient\",
    \"age\": 40,
    \"gender\": \"Male\",
    \"organisationHospital\": \"Test Hospital\",
    \"serviceName\": \"WES\",
    \"sampleType\": \"blood\",
    \"amountQuoted\": 25000,
    \"geneticCounselorRequired\": true
  }" > /dev/null

LEAD_ID=$(curl -s "$BASE_URL/api/leads" | jq -r ".[] | select(.uniqueId == \"$TEST_ID\") | .id")

if [ -z "$LEAD_ID" ] || [ "$LEAD_ID" == "null" ]; then
  echo "  ✗ Failed to create lead"
  exit 1
fi

echo "  ✓ Lead created: $LEAD_ID"
sleep 2

# Check GC records after lead creation
GC_COUNT_1=$(curl -s "$BASE_URL/api/genetic-counselling-sheet" | jq "[.[] | select(.unique_id == \"$TEST_ID\")] | length")
echo "  GC records after creation: $GC_COUNT_1"

# Step 2: Convert lead (this should NOT create a duplicate)
echo ""
echo "Step 2: Converting lead to sample..."
curl -s -X POST "$BASE_URL/api/leads/$LEAD_ID/convert" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 25000,
    "paidAmount": 10000,
    "status": "pickup_scheduled",
    "createGeneticCounselling": true
  }' > /dev/null

echo "  ✓ Lead converted"
sleep 2

# Check GC records after conversion
GC_COUNT_2=$(curl -s "$BASE_URL/api/genetic-counselling-sheet" | jq "[.[] | select(.unique_id == \"$TEST_ID\")] | length")
echo "  GC records after conversion: $GC_COUNT_2"

# Step 3: Frontend reconciliation call (should also NOT create duplicate)
echo ""
echo "Step 3: Testing frontend reconciliation..."
curl -s -X POST "$BASE_URL/api/gc-registration" \
  -H "Content-Type: application/json" \
  -d "{
    \"uniqueId\": \"$TEST_ID\",
    \"sample_id\": \"$TEST_ID\"
  }" > /dev/null

echo "  ✓ Reconciliation called"
sleep 1

# Final check
GC_COUNT_FINAL=$(curl -s "$BASE_URL/api/genetic-counselling-sheet" | jq "[.[] | select(.unique_id == \"$TEST_ID\")] | length")
echo "  GC records after reconciliation: $GC_COUNT_FINAL"

echo ""
echo "========================================="
echo "Test Results"
echo "========================================="
echo "After lead creation:    $GC_COUNT_1 record(s)"
echo "After conversion:       $GC_COUNT_2 record(s)"
echo "After reconciliation:   $GC_COUNT_FINAL record(s)"
echo ""

if [ "$GC_COUNT_FINAL" -eq 1 ]; then
  echo "✓✓ SUCCESS: Deduplication working!"
  echo "   Only 1 GC record created for $TEST_ID"
  echo ""
  echo "Record details:"
  curl -s "$BASE_URL/api/genetic-counselling-sheet" | jq ".[] | select(.unique_id == \"$TEST_ID\") | {id, unique_id, patient_client_name, age, created_at}"
  exit 0
else
  echo "✗✗ FAILURE: Found $GC_COUNT_FINAL records (duplicates!)"
  echo ""
  echo "All records for $TEST_ID:"
  curl -s "$BASE_URL/api/genetic-counselling-sheet" | jq ".[] | select(.unique_id == \"$TEST_ID\")"
  exit 1
fi

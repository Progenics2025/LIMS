#!/bin/bash

# Test script to verify genetic counselling duplicate fix
# This tests that GC records are NOT duplicated when:
# 1. Creating a lead with geneticCounselorRequired=true
# 2. Converting that lead
# 3. Frontend reconciliation calling /api/gc-registration

BASE_URL="http://localhost:4000"

echo "========================================="
echo "Testing Genetic Counselling Duplicate Fix"
echo "========================================="
echo ""

# Step 1: Clean up any existing test data
echo "Step 1: Cleaning up existing test data..."
curl -s -X GET "$BASE_URL/api/genetic-counselling-sheet" | \
  jq -r '.[] | select(.unique_id | startswith("GCTEST")) | .id' | \
  while read -r id; do
    echo "  Deleting GC record ID: $id"
    curl -s -X DELETE "$BASE_URL/api/gc-registration/$id" > /dev/null
  done

curl -s -X GET "$BASE_URL/api/leads" | \
  jq -r '.[] | select(.uniqueId | startswith("GCTEST")) | .id' | \
  while read -r id; do
    echo "  Deleting lead ID: $id"
    curl -s -X DELETE "$BASE_URL/api/leads/$id" > /dev/null
  done

echo "  ✓ Cleanup complete"
echo ""

# Step 2: Create a lead with geneticCounselorRequired=true
echo "Step 2: Creating lead with geneticCounselorRequired=true..."
LEAD_RESPONSE=$(curl -s -X POST "$BASE_URL/api/leads" \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueId": "GCTEST001",
    "projectId": "PG250125TEST",
    "patientClientName": "Test Patient GC",
    "age": 40,
    "gender": "Male",
    "patientClientEmail": "test-gc@example.com",
    "patientClientPhone": "+919876543210",
    "clinicianResearcherName": "Dr Test",
    "organisationHospital": "Test Hospital",
    "speciality": "Genetics",
    "serviceName": "Whole Exome Sequencing",
    "amountQuoted": 30000,
    "sampleType": "blood",
    "salesResponsiblePerson": "Test Sales",
    "geneticCounselorRequired": true
  }')

LEAD_ID=$(echo "$LEAD_RESPONSE" | jq -r '.id')
echo "  Created lead ID: $LEAD_ID"
echo "  Unique ID: GCTEST001"
echo ""

# Wait for backend auto-creation
sleep 2

# Step 3: Check how many GC records exist
echo "Step 3: Checking GC records after lead creation..."
GC_COUNT=$(curl -s -X GET "$BASE_URL/api/genetic-counselling-sheet" | jq '[.[] | select(.unique_id == "GCTEST001")] | length')
echo "  GC records found: $GC_COUNT"

if [ "$GC_COUNT" -eq 1 ]; then
  echo "  ✓ PASS: Only 1 GC record created (expected)"
else
  echo "  ✗ FAIL: Expected 1 record, found $GC_COUNT"
fi
echo ""

# Step 4: Convert the lead (should NOT create another GC record)
echo "Step 4: Converting lead to sample..."
CONVERT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/leads/$LEAD_ID/convert" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 30000,
    "paidAmount": 15000,
    "status": "pickup_scheduled",
    "createGeneticCounselling": true
  }')

SAMPLE_ID=$(echo "$CONVERT_RESPONSE" | jq -r '.sample.uniqueId')
echo "  Converted to sample ID: $SAMPLE_ID"
echo ""

# Wait for backend processing
sleep 2

# Step 5: Check GC records after conversion
echo "Step 5: Checking GC records after conversion..."
GC_COUNT_AFTER=$(curl -s -X GET "$BASE_URL/api/genetic-counselling-sheet" | jq '[.[] | select(.unique_id == "GCTEST001")] | length')
echo "  GC records found: $GC_COUNT_AFTER"

if [ "$GC_COUNT_AFTER" -eq 1 ]; then
  echo "  ✓ PASS: Still only 1 GC record (deduplication working)"
else
  echo "  ✗ FAIL: Expected 1 record, found $GC_COUNT_AFTER (duplicate created!)"
fi
echo ""

# Step 6: Frontend reconciliation (simulate LeadManagement.tsx call)
echo "Step 6: Simulating frontend reconciliation call..."
curl -s -X POST "$BASE_URL/api/gc-registration" \
  -H "Content-Type: application/json" \
  -d "{
    \"sample_id\": \"GCTEST001\",
    \"approval_status\": \"pending\"
  }" > /dev/null

sleep 1

# Step 7: Final check
echo "Step 7: Final GC record count check..."
GC_COUNT_FINAL=$(curl -s -X GET "$BASE_URL/api/genetic-counselling-sheet" | jq '[.[] | select(.unique_id == "GCTEST001")] | length')
GC_RECORDS=$(curl -s -X GET "$BASE_URL/api/genetic-counselling-sheet" | jq '[.[] | select(.unique_id == "GCTEST001")] | .[] | {id, unique_id, patient_client_name, created_at}')

echo "  Final GC records found: $GC_COUNT_FINAL"
echo ""
echo "  Record details:"
echo "$GC_RECORDS" | jq '.'
echo ""

if [ "$GC_COUNT_FINAL" -eq 1 ]; then
  echo "  ✓✓ SUCCESS: Deduplication fix working perfectly!"
  echo "  All three auto-creation points checked for duplicates"
else
  echo "  ✗✗ FAILURE: Expected 1 record, found $GC_COUNT_FINAL"
  echo "  Deduplication not working - found $GC_COUNT_FINAL records!"
fi

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Lead creation GC records: $GC_COUNT (expected: 1)"
echo "After conversion GC records: $GC_COUNT_AFTER (expected: 1)"
echo "After frontend reconciliation: $GC_COUNT_FINAL (expected: 1)"
echo ""

if [ "$GC_COUNT" -eq 1 ] && [ "$GC_COUNT_AFTER" -eq 1 ] && [ "$GC_COUNT_FINAL" -eq 1 ]; then
  echo "✓ ALL TESTS PASSED - No duplicates created!"
  exit 0
else
  echo "✗ SOME TESTS FAILED - Duplicates still being created"
  exit 1
fi

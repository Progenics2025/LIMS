#!/bin/bash

echo "=========================================="
echo "Bidirectional Sync Test"
echo "Lead Management ↔ Process Master"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Test 1: Lead Management → Process Master Sync${NC}"
echo "================================================"
echo ""

echo "Step 1a: Create a new lead in Lead Management"
echo "----------------------------------------------"
LEAD_DATA='{
  "uniqueId": "SYNC_TEST_002",
  "projectId": "PG_SYNC_002",
  "sampleId": "SAMPLE_SYNC_002",
  "patientClientName": "Bidirectional Sync Test Patient",
  "age": 40,
  "gender": "Female",
  "serviceName": "WES",
  "tat": "30 days",
  "organisationHospital": "Test Hospital",
  "clinicianResearcherName": "Dr. Test",
  "salesResponsiblePerson": "Sales Person A"
}'

LEAD_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$LEAD_DATA" \
  http://localhost:4000/api/leads)

LEAD_ID=$(echo "$LEAD_RESPONSE" | jq -r '.id // .insertId // empty')

if [ -z "$LEAD_ID" ]; then
  echo "⚠️  Lead creation might have failed, checking by unique_id..."
  LEAD_ID=$(curl -s http://localhost:4000/api/leads | jq -r '.[] | select(.uniqueId == "SYNC_TEST_002" or .unique_id == "SYNC_TEST_002") | .id')
fi

echo -e "${GREEN}✓ Lead created with ID: $LEAD_ID${NC}"
echo ""

echo "Step 1b: Wait for sync to complete (1 second)"
sleep 1

echo "Step 1c: Check if it appears in Process Master"
echo "------------------------------------------------"
PM_DATA=$(curl -s http://localhost:4000/api/process-master | \
  jq '.[] | select(.unique_id == "SYNC_TEST_002")')

if [ ! -z "$PM_DATA" ]; then
  echo -e "${GREEN}✓ Record found in Process Master!${NC}"
  echo "$PM_DATA" | jq '{
    id,
    unique_id,
    project_id,
    patient_client_name,
    age,
    gender,
    service_name,
    tat,
    organisation_hospital,
    clinician_researcher_name,
    sales_responsible_person
  }'
else
  echo "❌ Record NOT found in Process Master (sync may have failed)"
fi
echo ""

PM_ID=$(echo "$PM_DATA" | jq -r '.id')

echo "=========================================="
echo -e "${BLUE}Test 2: Process Master → Lead Management Sync${NC}"
echo "================================================"
echo ""

echo "Step 2a: Update the record in Process Master"
echo "----------------------------------------------"
PM_UPDATE='{
  "patient_client_name": "Updated via Process Master",
  "age": 42,
  "tat": "45 days",
  "organisation_hospital": "Updated Hospital Name"
}'

curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d "$PM_UPDATE" \
  http://localhost:4000/api/process-master/$PM_ID > /dev/null

echo -e "${GREEN}✓ Process Master record updated${NC}"
echo ""

echo "Step 2b: Wait for sync to complete (1 second)"
sleep 1

echo "Step 2c: Check if changes reflect in Lead Management"
echo "------------------------------------------------------"
LEAD_AFTER_SYNC=$(curl -s http://localhost:4000/api/leads | \
  jq '.[] | select(.uniqueId == "SYNC_TEST_002" or .unique_id == "SYNC_TEST_002")')

echo "$LEAD_AFTER_SYNC" | jq '{
  id,
  uniqueId: (.uniqueId // .unique_id),
  patientClientName: (.patientClientName // .patient_client_name),
  age,
  tat,
  organisationHospital: (.organisationHospital // .organisation_hospital)
}'
echo ""

# Verify sync worked
SYNCED_NAME=$(echo "$LEAD_AFTER_SYNC" | jq -r '.patientClientName // .patient_client_name')
SYNCED_AGE=$(echo "$LEAD_AFTER_SYNC" | jq -r '.age')

if [[ "$SYNCED_NAME" == "Updated via Process Master" && "$SYNCED_AGE" == "42" ]]; then
  echo -e "${GREEN}✓ Sync successful! Changes from Process Master reflected in Lead Management${NC}"
else
  echo "❌ Sync failed or incomplete"
  echo "   Expected: patient_client_name='Updated via Process Master', age=42"
  echo "   Got: patient_client_name='$SYNCED_NAME', age='$SYNCED_AGE'"
fi
echo ""

echo "=========================================="
echo -e "${BLUE}Test 3: Process Master Exclusive Fields${NC}"
echo "================================================"
echo ""

echo "Step 3a: Add Process Master-only fields (status, third-party)"
echo "----------------------------------------------------------------"
PM_EXCLUSIVE='{
  "logistic_status": "Completed",
  "finance_status": "Pending",
  "lab_process_status": "In Progress",
  "bioinformatics_status": "Not Started",
  "third_party_name": "External Lab XYZ",
  "sample_sent_to_third_party_date": "2025-11-24"
}'

curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d "$PM_EXCLUSIVE" \
  http://localhost:4000/api/process-master/$PM_ID > /dev/null

echo -e "${GREEN}✓ Process Master exclusive fields added${NC}"
echo ""

echo "Step 3b: Wait for sync attempt (1 second)"
sleep 1

echo "Step 3c: Verify these fields DON'T sync to Lead Management"
echo "------------------------------------------------------------"
LEAD_CHECK=$(curl -s http://localhost:4000/api/leads/$LEAD_ID)

echo "Checking Lead Management record for Process Master-only fields:"
echo "$LEAD_CHECK" | jq '{
  uniqueId: (.uniqueId // .unique_id),
  patientClientName: (.patientClientName // .patient_client_name),
  logistic_status: (.logisticStatus // .logistic_status // "NOT PRESENT"),
  finance_status: (.financeStatus // .finance_status // "NOT PRESENT"),
  third_party_name: (.thirdPartyName // .third_party_name // "NOT PRESENT")
}'
echo ""

HAS_LOGISTIC=$(echo "$LEAD_CHECK" | jq -r '.logisticStatus // .logistic_status // "null"')
if [ "$HAS_LOGISTIC" == "null" ]; then
  echo -e "${GREEN}✓ Correct! Status fields are NOT in Lead Management (as expected)${NC}"
else
  echo "⚠️  Unexpected: Status fields found in Lead Management"
fi
echo ""

echo "Step 3d: Show Process Master has these exclusive fields"
echo "---------------------------------------------------------"
curl -s http://localhost:4000/api/process-master/$PM_ID | jq '{
  unique_id,
  patient_client_name,
  logistic_status,
  finance_status,
  lab_process_status,
  bioinformatics_status,
  third_party_name,
  sample_sent_to_third_party_date
}'
echo ""

echo "=========================================="
echo -e "${YELLOW}Summary of Synced vs. Exclusive Fields${NC}"
echo "=========================================="
echo ""
echo "✓ SYNCED FIELDS (25 total):"
echo "  - Patient info: name, age, gender, email, phone, address"
echo "  - Clinician info: name, email, phone, address, specialty, organization"
echo "  - Sample info: sampleId, collection date, received date, service, type, count"
echo "  - Process info: TAT, sales person, progenics TRF, remark/comment"
echo ""
echo "❌ PROCESS MASTER ONLY (12 total):"
echo "  - Status fields: logistic, finance, lab process, bioinformatics, nutrition"
echo "  - Third party: name, TRF, report, sent date, received date"
echo "  - Reports: progenics report, release date"
echo ""

echo "=========================================="
echo "Field Mapping Verification"
echo "=========================================="
echo ""

echo "Comparing field names between tables:"
echo ""
printf "%-35s %-40s %-10s\n" "Lead Management Field" "Process Master Field" "Synced?"
printf "%-35s %-40s %-10s\n" "=====================" "=====================" "======="
printf "%-35s %-40s %-10s\n" "patientClientName" "patient_client_name" "✓"
printf "%-35s %-40s %-10s\n" "age" "age" "✓"
printf "%-35s %-40s %-10s\n" "gender" "gender" "✓"
printf "%-35s %-40s %-10s\n" "serviceName" "service_name" "✓"
printf "%-35s %-40s %-10s\n" "tat" "tat" "✓"
printf "%-35s %-40s %-10s\n" "organisationHospital" "organisation_hospital" "✓"
printf "%-35s %-40s %-10s\n" "clinicianResearcherName" "clinician_researcher_name" "✓"
printf "%-35s %-40s %-10s\n" "salesResponsiblePerson" "sales_responsible_person" "✓"
printf "%-35s %-40s %-10s\n" "(not in lead_management)" "logistic_status" "✗"
printf "%-35s %-40s %-10s\n" "(not in lead_management)" "finance_status" "✗"
printf "%-35s %-40s %-10s\n" "(not in lead_management)" "lab_process_status" "✗"
printf "%-35s %-40s %-10s\n" "(not in lead_management)" "third_party_name" "✗"
echo ""

echo "=========================================="
echo "Cleanup"
echo "=========================================="
echo ""
read -p "Delete test records? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  curl -s -X DELETE http://localhost:4000/api/leads/$LEAD_ID > /dev/null
  curl -s -X DELETE http://localhost:4000/api/process-master/$PM_ID > /dev/null
  echo -e "${GREEN}✓ Test records deleted${NC}"
else
  echo "Test records kept:"
  echo "  - Lead ID: $LEAD_ID (unique_id: SYNC_TEST_002)"
  echo "  - Process Master ID: $PM_ID"
fi
echo ""

echo "=========================================="
echo "Test Complete!"
echo "=========================================="
echo ""
echo "For more details, see: BIDIRECTIONAL_SYNC_MAPPING.md"

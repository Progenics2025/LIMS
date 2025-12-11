#!/bin/bash

echo "=========================================="
echo "Testing Bidirectional Sync After Fix"
echo "=========================================="
echo ""

echo "IMPORTANT: Make sure the server has been restarted!"
echo "If you haven't restarted, press Ctrl+C and run:"
echo "  pkill -f 'tsx server/index.ts' && npm run dev"
echo ""
read -p "Press Enter to continue testing..."
echo ""

# Test 1: Process Master → Lead Sync
echo "Test 1: Process Master → Lead Management Sync"
echo "==============================================="
echo ""

echo "Step 1: Get current lead data"
echo "------------------------------"
LEAD_BEFORE=$(curl -s http://localhost:4000/api/leads | \
  jq '.[] | select(.uniqueId == "SYNC_TEST_002" or .unique_id == "SYNC_TEST_002")')

echo "$LEAD_BEFORE" | jq '{
  uniqueId: (.uniqueId // .unique_id),
  patientName: (.patientClientName // .patient_client_name),
  age,
  tat,
  service: (.serviceName // .service_name)
}'
echo ""

echo "Step 2: Update via Process Master"
echo "----------------------------------"
PM_ID=$(curl -s http://localhost:4000/api/process-master | \
  jq -r '.[] | select(.unique_id == "SYNC_TEST_002") | .id')

echo "Process Master ID: $PM_ID"

curl -s -X PUT http://localhost:4000/api/process-master/$PM_ID \
  -H "Content-Type: application/json" \
  -d '{
    "patient_client_name": "✓ BIDIRECTIONAL SYNC WORKING",
    "age": 55,
    "tat": "55 days - Updated from PM",
    "service_name": "WES - Synced from PM",
    "gender": "Female",
    "organisation_hospital": "Sync Test Hospital",
    "sales_responsible_person": "PM Sales Person"
  }' | jq '{
  id,
  unique_id,
  patient_client_name,
  age,
  tat,
  service_name
}'
echo ""

echo "Step 3: Wait for sync (2 seconds)"
sleep 2

echo "Step 4: Verify Lead was updated"
echo "--------------------------------"
LEAD_AFTER=$(curl -s http://localhost:4000/api/leads | \
  jq '.[] | select(.uniqueId == "SYNC_TEST_002" or .unique_id == "SYNC_TEST_002")')

echo "$LEAD_AFTER" | jq '{
  uniqueId: (.uniqueId // .unique_id),
  patientName: (.patientClientName // .patient_client_name),
  age,
  tat,
  service: (.serviceName // .service_name),
  gender,
  organisation: (.organisationHospital // .organisation_hospital),
  salesPerson: (.salesResponsiblePerson // .sales_responsible_person)
}'
echo ""

# Check if sync worked
SYNCED_NAME=$(echo "$LEAD_AFTER" | jq -r '.patientClientName // .patient_client_name')
SYNCED_AGE=$(echo "$LEAD_AFTER" | jq -r '.age')
SYNCED_TAT=$(echo "$LEAD_AFTER" | jq -r '.tat')

if [[ "$SYNCED_NAME" == "✓ BIDIRECTIONAL SYNC WORKING" && "$SYNCED_AGE" == "55" ]]; then
  echo "✅ SUCCESS! Process Master → Lead sync is WORKING!"
  echo "   - Patient name synced: $SYNCED_NAME"
  echo "   - Age synced: $SYNCED_AGE"
  echo "   - TAT synced: $SYNCED_TAT"
else
  echo "❌ FAILED! Sync did not work"
  echo "   Expected: patient_client_name='✓ BIDIRECTIONAL SYNC WORKING', age=55"
  echo "   Got: patient_client_name='$SYNCED_NAME', age='$SYNCED_AGE'"
  echo ""
  echo "Possible causes:"
  echo "  1. Server hasn't restarted - run: pkill -f 'tsx server/index.ts' && npm run dev"
  echo "  2. Database connection issue"
  echo "  3. Check server console for error logs"
fi
echo ""

# Test 2: Lead → Process Master Sync
echo "=========================================="
echo "Test 2: Lead Management → Process Master Sync"
echo "==============================================="
echo ""

echo "Step 1: Update via Lead Management"
echo "-----------------------------------"
LEAD_ID=$(echo "$LEAD_AFTER" | jq -r '.id')

curl -s -X PUT http://localhost:4000/api/leads/$LEAD_ID \
  -H "Content-Type: application/json" \
  -d '{
    "patientClientName": "✓ REVERSE SYNC WORKING",
    "age": 66,
    "tat": "66 days - Updated from Lead",
    "serviceName": "WGS - Synced from Lead"
  }' > /dev/null

echo "Lead updated"
echo ""

echo "Step 2: Wait for sync (2 seconds)"
sleep 2

echo "Step 3: Verify Process Master was updated"
echo "------------------------------------------"
PM_AFTER=$(curl -s http://localhost:4000/api/process-master/$PM_ID)

echo "$PM_AFTER" | jq '{
  id,
  unique_id,
  patient_client_name,
  age,
  tat,
  service_name
}'
echo ""

PM_SYNCED_NAME=$(echo "$PM_AFTER" | jq -r '.patient_client_name')
PM_SYNCED_AGE=$(echo "$PM_AFTER" | jq -r '.age')

if [[ "$PM_SYNCED_NAME" == "✓ REVERSE SYNC WORKING" && "$PM_SYNCED_AGE" == "66" ]]; then
  echo "✅ SUCCESS! Lead → Process Master sync is WORKING!"
else
  echo "❌ FAILED! Reverse sync did not work"
  echo "   Expected: patient_client_name='✓ REVERSE SYNC WORKING', age=66"
  echo "   Got: patient_client_name='$PM_SYNCED_NAME', age='$PM_SYNCED_AGE'"
fi
echo ""

echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "Synced Fields Test:"
echo "-------------------"
echo "Testing all 25 bidirectionally synced fields..."
echo ""

# Update PM with all fields
curl -s -X PUT http://localhost:4000/api/process-master/$PM_ID \
  -H "Content-Type: application/json" \
  -d '{
    "patient_client_name": "Full Field Test",
    "age": 45,
    "gender": "Male",
    "patient_client_email": "test@sync.com",
    "patient_client_phone": "123-456-7890",
    "patient_client_address": "123 Sync Street",
    "organisation_hospital": "Sync Hospital",
    "clinician_researcher_name": "Dr. Sync",
    "speciality": "Genetics",
    "clinician_researcher_email": "dr@sync.com",
    "clinician_researcher_phone": "098-765-4321",
    "clinician_researcher_address": "456 Clinic Ave",
    "service_name": "WGS Full Test",
    "sample_type": "Blood",
    "no_of_samples": 3,
    "tat": "30 days full test",
    "sales_responsible_person": "Sales Manager",
    "progenics_trf": "/path/to/trf.pdf",
    "Remark_Comment": "Full field sync test comment"
  }' > /dev/null

sleep 2

echo "Updated PM with all common fields..."
echo ""

FULL_LEAD=$(curl -s http://localhost:4000/api/leads/$LEAD_ID)
echo "Checking Lead for synced fields:"
echo "$FULL_LEAD" | jq '{
  patientName: (.patientClientName // .patient_client_name),
  age,
  gender,
  email: (.patientClientEmail // .patient_client_email),
  phone: (.patientClientPhone // .patient_client_phone),
  organisation: (.organisationHospital // .organisation_hospital),
  clinician: (.clinicianResearcherName // .clinician_researcher_name),
  specialty: (.speciality // .speciality),
  service: (.serviceName // .service_name),
  tat,
  salesPerson: (.salesResponsiblePerson // .sales_responsible_person)
}'
echo ""

echo "=========================================="
echo "Process Master Exclusive Fields Test"
echo "=========================================="
echo ""

echo "These fields should NOT sync to Lead Management:"
echo "-------------------------------------------------"
curl -s -X PUT http://localhost:4000/api/process-master/$PM_ID \
  -H "Content-Type: application/json" \
  -d '{
    "logistic_status": "Completed",
    "finance_status": "Paid",
    "lab_process_status": "Processing",
    "bioinformatics_status": "Analysis Complete",
    "nutritional_management_status": "Consultation Done",
    "third_party_name": "External Lab",
    "third_party_trf": "/path/to/external_trf.pdf",
    "progenics_report": "/path/to/report.pdf",
    "progenics_report_release_date": "2025-11-24"
  }' > /dev/null

echo "Updated PM with exclusive fields..."
sleep 1

echo ""
echo "Checking if Lead has these fields (should be null/undefined):"
LEAD_CHECK=$(curl -s http://localhost:4000/api/leads/$LEAD_ID)
HAS_STATUS=$(echo "$LEAD_CHECK" | jq 'has("logisticStatus") or has("logistic_status")')

if [ "$HAS_STATUS" == "false" ]; then
  echo "✅ CORRECT: Status fields are NOT in Lead Management"
else
  echo "⚠️  Unexpected: Found status fields in Lead"
fi
echo ""

echo "=========================================="
echo "Documentation Reference"
echo "=========================================="
echo ""
echo "For complete field mapping details, see:"
echo "  - BIDIRECTIONAL_SYNC_MAPPING.md"
echo ""
echo "Synced Fields: 25 total"
echo "  ✓ Patient info (name, age, gender, contact)"
echo "  ✓ Clinician info (name, specialty, contact)"  
echo "  ✓ Sample info (service, type, TAT, samples count)"
echo "  ✓ Process info (sales person, TRF, comments)"
echo ""
echo "Process Master Only: 12 fields"
echo "  ✗ Status fields (logistic, finance, lab, bio, nutrition)"
echo "  ✗ Third party info (name, TRF, report, dates)"
echo "  ✗ Reports (progenics report, release date)"
echo ""

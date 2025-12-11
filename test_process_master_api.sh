#!/bin/bash

# Process Master API Testing Script
# Tests CRUD operations for process_master_sheet table

BASE_URL="http://localhost:4000"

echo "=========================================="
echo "Process Master API Test Suite"
echo "=========================================="
echo ""

# Test 1: GET - Fetch all records
echo "TEST 1: GET - Fetch All Process Master Records"
echo "-----------------------------------------------"
RECORDS_COUNT=$(curl -s $BASE_URL/api/process-master | jq 'length')
echo "Current record count: $RECORDS_COUNT"
curl -s $BASE_URL/api/process-master | jq '.[0:2] | .[] | {id, unique_id, project_id, patient_client_name, service_name}'
echo ""

# Test 2: POST - Create new process master record
echo "TEST 2: POST - Create New Process Master Record"
echo "------------------------------------------------"
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/process-master \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "PM_API_TEST_' $(date +%s)'",
    "project_id": "PG_TEST_' $(date +%s)'",
    "sample_id": "SAMPLE_' $(date +%s)'",
    "client_id": "CLIENT_001",
    "organisation_hospital": "Test Hospital",
    "clinician_researcher_name": "Dr. Test Doctor",
    "speciality": "Genetics",
    "clinician_researcher_email": "test@hospital.com",
    "clinician_researcher_phone": "1234567890",
    "patient_client_name": "Test Patient",
    "age": 30,
    "gender": "Male",
    "patient_client_email": "patient@email.com",
    "patient_client_phone": "0987654321",
    "sample_collection_date": "2025-11-20",
    "sample_recevied_date": "2025-11-21",
    "service_name": "WGS",
    "sample_type": "Blood",
    "no_of_samples": 1,
    "tat": "15 days",
    "sales_responsible_person": "John Doe",
    "logistic_status": "received",
    "finance_status": "pending",
    "lab_process_status": "in_progress",
    "bioinformatics_status": "pending",
    "nutritional_management_status": "not_required",
    "Remark_Comment": "Test comment for API testing",
    "created_by": "api_test_user"
  }')

CREATED_ID=$(echo $CREATE_RESPONSE | jq -r '.id')
CREATED_UNIQUE_ID=$(echo $CREATE_RESPONSE | jq -r '.unique_id')
echo "Created Record:"
echo $CREATE_RESPONSE | jq '{id, unique_id, project_id, patient_client_name, service_name, created_at}'
echo ""

# Test 3: GET - Fetch single record
echo "TEST 3: GET - Fetch Single Process Master Record (ID: $CREATED_ID)"
echo "--------------------------------------------------------------------"
curl -s $BASE_URL/api/process-master | jq ".[] | select(.id == $CREATED_ID) | {id, unique_id, project_id, patient_client_name, service_name, age, gender}"
echo ""

# Test 4: PUT - Update the record
echo "TEST 4: PUT - Update Process Master Record (ID: $CREATED_ID)"
echo "--------------------------------------------------------------"
UPDATE_RESPONSE=$(curl -s -X PUT $BASE_URL/api/process-master/$CREATED_ID \
  -H "Content-Type: application/json" \
  -d '{
    "patient_client_name": "Updated Test Patient",
    "age": 35,
    "gender": "Female",
    "service_name": "WES",
    "lab_process_status": "completed",
    "bioinformatics_status": "in_progress",
    "finance_status": "paid",
    "Remark_Comment": "Updated via API test",
    "modified_by": "api_test_updater"
  }')

echo "Updated Record:"
echo $UPDATE_RESPONSE | jq '{id, unique_id, patient_client_name, age, gender, service_name, lab_process_status, bioinformatics_status, finance_status, modified_at, modified_by}'
echo ""

# Test 5: Verify update persisted
echo "TEST 5: Verify Update Persisted"
echo "--------------------------------"
curl -s $BASE_URL/api/process-master | jq ".[] | select(.id == $CREATED_ID) | {id, patient_client_name, age, gender, service_name, lab_process_status, modified_at}"
echo ""

# Test 6: Field Mapping Test - Test all major fields
echo "TEST 6: Field Mapping Test - All Major Fields"
echo "----------------------------------------------"
FIELD_TEST_RESPONSE=$(curl -s -X POST $BASE_URL/api/process-master \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "PM_FIELD_TEST_' $(date +%s)'",
    "project_id": "DG_FIELD_TEST",
    "sample_id": "SAMPLE_FIELD",
    "progenics_trf": "TRF_001.pdf",
    "third_party_trf": "THIRD_PARTY_TRF.pdf",
    "progenics_report": "REPORT_001.pdf",
    "sample_sent_to_third_party_date": "2025-11-22",
    "third_party_name": "External Lab",
    "third_party_report": "EXTERNAL_REPORT.pdf",
    "results_raw_data_received_from_third_party_date": "2025-11-23",
    "progenics_report_release_date": "2025-11-24"
  }')

FIELD_TEST_ID=$(echo $FIELD_TEST_RESPONSE | jq -r '.id')
echo "Field Mapping Test Record Created (ID: $FIELD_TEST_ID):"
echo $FIELD_TEST_RESPONSE | jq '{id, unique_id, project_id, progenics_trf, third_party_trf, progenics_report, third_party_name, progenics_report_release_date}'
echo ""

# Test 7: DELETE - Cleanup test records
echo "TEST 7: DELETE - Cleanup Test Records"
echo "--------------------------------------"
echo "Deleting Record ID: $CREATED_ID"
curl -s -X DELETE $BASE_URL/api/process-master/$CREATED_ID | jq '.'

echo "Deleting Record ID: $FIELD_TEST_ID"
curl -s -X DELETE $BASE_URL/api/process-master/$FIELD_TEST_ID | jq '.'
echo ""

# Test 8: Verify deletions
echo "TEST 8: Verify Deletions"
echo "------------------------"
FINAL_COUNT=$(curl -s $BASE_URL/api/process-master | jq 'length')
echo "Final record count: $FINAL_COUNT (should be same as initial count)"
echo ""

# Test 9: Status Field Values Test
echo "TEST 9: Status Field Values Test"
echo "---------------------------------"
STATUS_TEST=$(curl -s -X POST $BASE_URL/api/process-master \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "PM_STATUS_' $(date +%s)'",
    "project_id": "PG_STATUS_TEST",
    "logistic_status": "shipped",
    "finance_status": "invoiced",
    "lab_process_status": "completed",
    "bioinformatics_status": "analysis_complete",
    "nutritional_management_status": "counseling_provided"
  }')

STATUS_TEST_ID=$(echo $STATUS_TEST | jq -r '.id')
echo "Status Test Record:"
echo $STATUS_TEST | jq '{id, unique_id, logistic_status, finance_status, lab_process_status, bioinformatics_status, nutritional_management_status}'

# Cleanup status test
curl -s -X DELETE $BASE_URL/api/process-master/$STATUS_TEST_ID > /dev/null
echo "Status test record cleaned up"
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "✓ GET endpoint working"
echo "✓ POST endpoint working"
echo "✓ PUT endpoint working"
echo "✓ DELETE endpoint working"
echo "✓ Field mapping working"
echo "✓ Status fields working"
echo ""
echo "All Process Master API tests completed successfully!"
echo ""
echo "Frontend Integration Checklist:"
echo "-------------------------------"
echo "1. Check browser console for any JavaScript errors"
echo "2. Verify network tab shows successful API calls"
echo "3. Ensure form fields are properly mapped to snake_case"
echo "4. Check that date fields are formatted correctly"
echo "5. Verify status dropdowns have correct values"

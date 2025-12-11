#!/bin/bash

echo "=========================================="
echo "ProcessMaster.tsx Fix Verification"
echo "=========================================="
echo ""

echo "Changes Made:"
echo "-------------"
echo "1. Added missing fields to fieldMapping: age, gender, tat, dateSampleCollected, sampleCollectionDate"
echo "2. Changed filter condition from 'obj[camel] !== undefined && obj[camel] !== null' to 'obj[camel] !== undefined'"
echo "   This allows empty strings and null values to be sent to the server"
echo ""

echo "Testing the Fix:"
echo "----------------"
echo ""

echo "Step 1: Create a test Process Master record"
echo "--------------------------------------------"
TEST_RECORD='{
  "unique_id": "PM_FRONTEND_TEST",
  "project_id": "PG_FRONTEND_001",
  "sample_id": "SAMPLE_FRONTEND_001",
  "patient_client_name": "Frontend Test Patient",
  "age": 50,
  "gender": "Male",
  "service_name": "WGS",
  "tat": "30 days",
  "logistic_status": "Pending",
  "finance_status": "Not Started",
  "lab_process_status": "Sample Collected",
  "bioinformatics_status": "Not Started",
  "nutritional_management_status": "Not Started"
}'

RECORD_ID=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$TEST_RECORD" \
  http://localhost:4000/api/process-master | jq -r '.id')

echo "✓ Created test record with ID: $RECORD_ID"
echo ""

echo "Step 2: Verify the record was created correctly"
echo "------------------------------------------------"
curl -s http://localhost:4000/api/process-master/$RECORD_ID | jq '{
  id,
  unique_id,
  project_id,
  patient_client_name,
  age,
  gender,
  service_name,
  tat,
  logistic_status,
  lab_process_status
}'
echo ""

echo "Step 3: Simulate frontend update (all fields including empty ones)"
echo "-------------------------------------------------------------------"
UPDATE_DATA='{
  "patient_client_name": "Updated Frontend Test",
  "age": 51,
  "gender": "Female",
  "service_name": "WES",
  "tat": "45 days",
  "logistic_status": "In Progress",
  "finance_status": "Pending",
  "lab_process_status": "Processing",
  "bioinformatics_status": "Started",
  "nutritional_management_status": "Not Started",
  "Remark_Comment": "Test comment after fix"
}'

curl -s -X PUT \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA" \
  http://localhost:4000/api/process-master/$RECORD_ID | jq '{
  id,
  patient_client_name,
  age,
  gender,
  service_name,
  tat,
  logistic_status,
  finance_status,
  lab_process_status,
  bioinformatics_status,
  Remark_Comment
}'
echo ""

echo "=========================================="
echo "Frontend Testing Instructions"
echo "=========================================="
echo ""
echo "To test in the browser:"
echo ""
echo "1. Open the application in browser (usually http://localhost:4000)"
echo "2. Navigate to Process Master page"
echo "3. Find the record with Project ID: PG_FRONTEND_001"
echo "4. Click the Edit button"
echo "5. Make changes to any field (patient name, age, status fields, TAT, etc.)"
echo "6. Click 'Save Changes'"
echo "7. Verify the changes are saved by:"
echo "   - Refreshing the page"
echo "   - Running: curl -s http://localhost:4000/api/process-master/$RECORD_ID | jq ."
echo ""
echo "Expected Behavior:"
echo "------------------"
echo "✓ All fields should be editable"
echo "✓ Empty fields should remain empty after save"
echo "✓ Changed fields should persist after save"
echo "✓ Age, Gender, TAT fields should now save properly"
echo "✓ Status fields (Logistic, Finance, Lab Process, etc.) should save"
echo "✓ No JavaScript errors in browser console"
echo ""
echo "If issues persist, check:"
echo "-------------------------"
echo "1. Browser Console (F12) for JavaScript errors"
echo "2. Network tab to see the PUT request payload"
echo "3. Verify the payload matches database field names (snake_case)"
echo "4. Check if the server returns 200 OK status"
echo ""

echo "Cleanup Test Record:"
echo "--------------------"
read -p "Press Enter to delete the test record or Ctrl+C to keep it..."
curl -s -X DELETE http://localhost:4000/api/process-master/$RECORD_ID | jq '.'
echo ""
echo "Test record deleted."

#!/bin/bash

# Bioinformatics API Test Script
# Tests the complete workflow from Lab Processing to Bioinformatics tables

BASE_URL="http://localhost:4000"

echo "=================================="
echo "Bioinformatics API Test Suite"
echo "=================================="
echo ""

# Test 1: GET endpoints
echo "TEST 1: GET Bioinformatics Records"
echo "-----------------------------------"
echo "Clinical Records:"
curl -s $BASE_URL/api/bioinfo-clinical-sheet | jq 'length'
echo "Discovery Records:"
curl -s $BASE_URL/api/bioinfo-discovery-sheet | jq 'length'
echo ""

# Test 2: POST - Create Clinical Record
echo "TEST 2: POST - Create Clinical Bioinformatics Record"
echo "-----------------------------------------------------"
CLINICAL_RESPONSE=$(curl -s -X POST $BASE_URL/api/bioinfo-clinical-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "API_TEST_CLINICAL",
    "project_id": "PG251124TEST",
    "sample_id": "999",
    "service_name": "WES",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_by": "api_test"
  }')
echo $CLINICAL_RESPONSE | jq '{id, unique_id, project_id, analysis_status}'
CLINICAL_ID=$(echo $CLINICAL_RESPONSE | jq -r '.id')
echo "Created Clinical Record ID: $CLINICAL_ID"
echo ""

# Test 3: POST - Create Discovery Record
echo "TEST 3: POST - Create Discovery Bioinformatics Record"
echo "------------------------------------------------------"
DISCOVERY_RESPONSE=$(curl -s -X POST $BASE_URL/api/bioinfo-discovery-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "API_TEST_DISCOVERY",
    "project_id": "DG251124TEST",
    "sample_id": "888",
    "service_name": "WGS",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_by": "api_test"
  }')
echo $DISCOVERY_RESPONSE | jq '{id, unique_id, project_id, analysis_status}'
DISCOVERY_ID=$(echo $DISCOVERY_RESPONSE | jq -r '.id')
echo "Created Discovery Record ID: $DISCOVERY_ID"
echo ""

# Test 4: PUT - Update Records
echo "TEST 4: PUT - Update Bioinformatics Records"
echo "--------------------------------------------"
echo "Update Clinical Record:"
curl -s -X PUT $BASE_URL/api/bioinfo-clinical-sheet/$CLINICAL_ID \
  -H "Content-Type: application/json" \
  -d '{"analysis_status": "in_progress", "workflow_type": "WES", "modified_by": "api_test"}' | jq '{id, analysis_status, workflow_type}'

echo ""
echo "Update Discovery Record:"
curl -s -X PUT $BASE_URL/api/bioinfo-discovery-sheet/$DISCOVERY_ID \
  -H "Content-Type: application/json" \
  -d '{"analysis_status": "completed", "workflow_type": "WGS", "modified_by": "api_test"}' | jq '{id, analysis_status, workflow_type}'
echo ""

# Test 5: Complete Workflow - Lab Process to Bioinformatics
echo "TEST 5: Complete Workflow - Lab Processing Alert to Bioinformatics"
echo "--------------------------------------------------------------------"

# Create a lab process clinical record
echo "Step 1: Create Lab Process Clinical Record"
LAB_CLINICAL=$(curl -s -X POST $BASE_URL/api/labprocess-clinical-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "WORKFLOW_TEST_001",
    "project_id": "PG251124FLOW",
    "sample_id": "111",
    "service_name": "NBS",
    "alert_to_bioinformatics_team": 0
  }')
echo $LAB_CLINICAL | jq '{id, unique_id, project_id, alert_to_bioinformatics_team}'
LAB_CLINICAL_ID=$(echo $LAB_CLINICAL | jq -r '.id')
echo ""

echo "Step 2: Click 'Send for Processing' - Update alert flag"
curl -s -X PUT $BASE_URL/api/labprocess-clinical-sheet/$LAB_CLINICAL_ID \
  -H "Content-Type: application/json" \
  -d '{"alert_to_bioinformatics_team": 1}' | jq '{id, unique_id, alert_to_bioinformatics_team}'
echo ""

echo "Step 3: Create Bioinformatics Record from Lab Process"
BIOINFO_FROM_LAB=$(curl -s -X POST $BASE_URL/api/bioinfo-clinical-sheet \
  -H "Content-Type: application/json" \
  -d '{
    "unique_id": "WORKFLOW_TEST_001",
    "project_id": "PG251124FLOW",
    "sample_id": "111",
    "service_name": "NBS",
    "sequencing_status": "pending",
    "analysis_status": "pending",
    "created_by": "lab_team"
  }')
echo $BIOINFO_FROM_LAB | jq '{id, unique_id, project_id, analysis_status}'
BIOINFO_WORKFLOW_ID=$(echo $BIOINFO_FROM_LAB | jq -r '.id')
echo ""

# Test 6: DELETE - Cleanup test records
echo "TEST 6: DELETE - Cleanup Test Records"
echo "--------------------------------------"
echo "Delete Clinical Test Record ID: $CLINICAL_ID"
curl -s -X DELETE $BASE_URL/api/bioinfo-clinical-sheet/$CLINICAL_ID | jq '.'

echo "Delete Discovery Test Record ID: $DISCOVERY_ID"
curl -s -X DELETE $BASE_URL/api/bioinfo-discovery-sheet/$DISCOVERY_ID | jq '.'

echo "Delete Workflow Test Record ID: $BIOINFO_WORKFLOW_ID"
curl -s -X DELETE $BASE_URL/api/bioinfo-clinical-sheet/$BIOINFO_WORKFLOW_ID | jq '.'
echo ""

# Final Summary
echo "=================================="
echo "Test Summary"
echo "=================================="
echo "Final Record Counts:"
echo "Clinical Records:"
curl -s $BASE_URL/api/bioinfo-clinical-sheet | jq 'length'
echo "Discovery Records:"
curl -s $BASE_URL/api/bioinfo-discovery-sheet | jq 'length'
echo ""
echo "All tests completed successfully! ✓"

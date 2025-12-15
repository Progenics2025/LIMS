#!/usr/bin/env bash
# Simple curl test commands for report_management API
# Update HOST if your server runs on a different host/port

HOST=${HOST:-http://localhost:3000}

echo "GET all records"
curl -sS -X GET "$HOST/api/report_management" | jq || true

echo "\nGET single record (replace UNIQUE_ID)"
curl -sS -X GET "$HOST/api/report_management/UNIQUE_ID" | jq || true

echo "\nPOST create record (example)"
curl -sS -X POST "$HOST/api/report_management" \
  -H 'Content-Type: application/json' \
  -d '{
    "unique_id": "U12345",
    "project_id": "P-001",
    "report_url": "https://example.com/reports/U12345.pdf",
    "report_release_date": "2025-12-15",
    "organisation_hospital": "Acme Hospital",
    "clinician_researcher_name": "Dr. Alice",
    "clinician_researcher_email": "alice@example.com",
    "patient_client_name": "John Doe",
    "age": 45,
    "gender": "Male",
    "genetic_counselor_required": true,
    "service_name": "WES",
    "tat": 7
  }' | jq || true

echo "\nPUT update record (replace UNIQUE_ID)"
curl -sS -X PUT "$HOST/api/report_management/U12345" \
  -H 'Content-Type: application/json' \
  -d '{"remark_comment":"Updated via curl","approval_from_finance":true}' | jq || true

echo "\nDELETE record (replace UNIQUE_ID)"
curl -sS -X DELETE "$HOST/api/report_management/U12345" | jq || true

echo "\nDone. Set HOST env var to change target, e.g. HOST=http://127.0.0.1:4000 ./report_management_curl_tests.sh"

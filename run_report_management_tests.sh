#!/usr/bin/env bash
HOST=${HOST:-http://localhost:4000}
set -euo pipefail

echo "--- GET all ---"
curl -i -sS "$HOST/api/report_management" || true

echo
echo "--- POST create ---"
curl -i -sS -X POST "$HOST/api/report_management" \
  -H "Content-Type: application/json" \
  -d '{"unique_id":"U_TEST_1","project_id":"P_TEST_1","report_url":"https://example.com/r.pdf","report_release_date":"2025-12-15","organisation_hospital":"Test Hosp","clinician_researcher_name":"Dr Test"}' || true

echo
echo "--- GET single (U_TEST_1) ---"
curl -i -sS "$HOST/api/report_management/U_TEST_1" || true

echo
echo "--- PUT update (U_TEST_1) ---"
curl -i -sS -X PUT "$HOST/api/report_management/U_TEST_1" \
  -H "Content-Type: application/json" \
  -d '{"remark_comment":"curl test update","approval_from_finance":true}' || true

echo
echo "--- GET single after update (U_TEST_1) ---"
curl -i -sS "$HOST/api/report_management/U_TEST_1" || true

echo
echo "--- DELETE (U_TEST_1) ---"
curl -i -sS -X DELETE "$HOST/api/report_management/U_TEST_1" || true

echo
echo "--- GET all after delete ---"
curl -i -sS "$HOST/api/report_management" || true


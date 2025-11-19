#!/usr/bin/env bash
set -euo pipefail

API_BASE="http://127.0.0.1:4000"

echo "==> 1) POST /api/leads (create lead)"
CREATE_RESP=$(curl -s -X POST "$API_BASE/api/leads" \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON'
{
  "organization":"Test Org Inc",
  "location":"Test City",
  "referredDoctor":"Dr Test",
  "clinicHospitalName":"Test Clinic",
  "phone":"9999999999",
  "email":"test+lead@example.com",
  "clientEmail":"patient@example.com",
  "testName":"Whole Genome Sequencing",
  "sampleType":"Blood",
  "amountQuoted":"1000",
  "tat":7,
  "category":"clinical",
  "geneticCounsellorRequired": true,
  "patientClientName":"John Doe",
  "patientClientEmail":"john.doe@example.com"
}
JSON
)

if [ -z "$CREATE_RESP" ]; then
  echo "ERROR: empty response from POST /api/leads"
  exit 2
fi

echo "Create response:"
echo "$CREATE_RESP"

# extract lead id manually
LEAD_ID=$(echo "$CREATE_RESP" | grep -oE '"id" *: *"[^"]+"' | head -n1 | cut -d'"' -f4)
if [ -z "$LEAD_ID" ]; then
  echo "ERROR: could not extract lead id from response"
  exit 3
fi
echo "Created lead id: $LEAD_ID"

echo
echo "==> 2) PUT /api/leads/:id/status (set to won)"
STATUS_OUT=$(curl -s -w "HTTP_CODE:%{http_code}" -o /tmp/status_body -X PUT "$API_BASE/api/leads/$LEAD_ID/status" \
  -H 'Content-Type: application/json' -d '{"status":"won"}')

cat /tmp/status_body || true
HTTP_CODE=$(echo "$STATUS_OUT" | sed -n 's/.*HTTP_CODE:\([0-9][0-9][0-9]\)$/\1/p')
if [ "$HTTP_CODE" != "200" ]; then
  echo "ERROR: status update returned HTTP $HTTP_CODE"
  exit 4
fi
echo "Status updated to 'won'"

echo
echo "==> 3) POST /api/leads/:id/convert (convert lead)"
CONVERT_RESP=$(curl -s -X POST "$API_BASE/api/leads/$LEAD_ID/convert" \
  -H 'Content-Type: application/json' \
  -d @- <<'JSON'
{
  "amount": "1000",
  "paidAmount": "0",
  "status": "pickup_scheduled",
  "organization": "Test Org Inc",
  "sampleType": "Blood",
  "titleUniqueId": "T-TEST-01",
  "sampleUniqueId": "S-TEST-01",
  "trackingId": "TRK123",
  "courierCompany": "DHL",
  "comments": "Converted for testing",
  "createGeneticCounselling": true
}
JSON
)

echo "Convert response:"
echo "$CONVERT_RESP"

SAMPLE_UUID=$(echo "$CONVERT_RESP" | grep -oE '"id" *: *"[^"]+"' | head -n1 | cut -d'"' -f4)
SAMPLE_HUMAN_ID=$(echo "$CONVERT_RESP" | grep -oE '"sampleId" *: *"[^"]+"' | head -n1 | cut -d'"' -f4)

echo "Sample human id: $SAMPLE_HUMAN_ID"
echo "Sample uuid: $SAMPLE_UUID"

echo
echo "==> 4) GET /api/samples"
curl -s "$API_BASE/api/samples"

echo
echo "==> 5) GET /api/finance/records"
curl -s "$API_BASE/api/finance/records?page=1&pageSize=50"

echo
echo "==> 6) GET /api/lab-processing"
curl -s "$API_BASE/api/lab-processing"

echo
echo "==> 7) GET /api/genetic-counselling"
curl -s "$API_BASE/api/genetic-counselling"

echo
echo "==> 8) GET /api/bioinformatics"
curl -s "$API_BASE/api/bioinformatics"

echo
echo "=== SUMMARY ==="
echo "Lead ID: $LEAD_ID"
echo "Sample human id: $SAMPLE_HUMAN_ID"
echo "Sample uuid: $SAMPLE_UUID"

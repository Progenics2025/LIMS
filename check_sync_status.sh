#!/bin/bash

echo "Checking bidirectional sync status..."
echo ""

echo "=== Process Master Records ==="
curl -s http://localhost:4000/api/process-master | jq -r '.[] | "\(.id) | \(.unique_id) | \(.patient_client_name)"' | head -10

echo ""
echo "=== Lead Management Records (last 10) ==="
curl -s http://localhost:4000/api/leads | jq -r '.[] | "\(.id) | \(.uniqueId // .unique_id) | \(.patientClientName // .patient_client_name)"' | tail -10

echo ""
echo "Testing if recently created leads synced to Process Master..."
echo ""

# Get last 3 leads
LEADS=$(curl -s http://localhost:4000/api/leads | jq -r '.[-3:] | .[] | .uniqueId // .unique_id')

for UNIQUE_ID in $LEADS; do
  PM_EXISTS=$(curl -s http://localhost:4000/api/process-master | jq -r ".[] | select(.unique_id == \"$UNIQUE_ID\") | .id")
  if [ -z "$PM_EXISTS" ]; then
    echo "❌ Lead $UNIQUE_ID NOT synced to Process Master"
  else
    echo "✓ Lead $UNIQUE_ID synced to Process Master (PM ID: $PM_EXISTS)"
  fi
done

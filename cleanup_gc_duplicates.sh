#!/bin/bash

echo "=========================================="
echo "Genetic Counselling - Find & Remove Duplicates"
echo "=========================================="
echo ""

echo "Fetching all genetic counselling records..."
ALL_RECORDS=$(curl -s http://localhost:4000/api/genetic-counselling-sheet)
TOTAL=$(echo "$ALL_RECORDS" | jq 'length')

echo "Total records: $TOTAL"
echo ""

echo "Analyzing for duplicates by unique_id..."
echo ""

# Group by unique_id and find duplicates
DUPLICATE_GROUPS=$(echo "$ALL_RECORDS" | jq -r '
  group_by(.unique_id) | 
  map(select(length > 1)) | 
  map({
    unique_id: .[0].unique_id,
    count: length,
    ids: map(.id),
    patient_name: .[0].patient_client_name
  })
')

DUPE_GROUP_COUNT=$(echo "$DUPLICATE_GROUPS" | jq 'length')

if [ "$DUPE_GROUP_COUNT" == "0" ]; then
  echo "✅ No duplicates found! Database is clean."
  exit 0
fi

echo "❌ Found $DUPE_GROUP_COUNT unique_id(s) with duplicates:"
echo ""

echo "$DUPLICATE_GROUPS" | jq -r '.[] | "  \(.unique_id) - \(.count) duplicates (Patient: \(.patient_name // "N/A"))"'
echo ""

echo "=========================================="
echo "Duplicate Details"
echo "=========================================="
echo ""

echo "$DUPLICATE_GROUPS" | jq -c '.[]' | while read -r group; do
  UNIQUE_ID=$(echo "$group" | jq -r '.unique_id')
  COUNT=$(echo "$group" | jq -r '.count')
  PATIENT=$(echo "$group" | jq -r '.patient_name // "N/A"')
  IDS=$(echo "$group" | jq -r '.ids | join(", ")')
  
  echo "Unique ID: $UNIQUE_ID"
  echo "Patient: $PATIENT"
  echo "Duplicate Count: $COUNT"
  echo "Record IDs: $IDS"
  echo ""
done

echo "=========================================="
echo "Cleanup Options"
echo "=========================================="
echo ""
echo "Choose an action:"
echo "  1) Keep oldest record (by created_at), delete others"
echo "  2) Keep newest record (by created_at), delete others"
echo "  3) Keep first by ID, delete others"
echo "  4) Manual selection for each group"
echo "  5) Cancel (no changes)"
echo ""
read -p "Enter choice (1-5): " CHOICE

if [ "$CHOICE" == "5" ]; then
  echo "No changes made."
  exit 0
fi

case $CHOICE in
  1)
    echo ""
    echo "Keeping oldest records, deleting newer duplicates..."
    echo ""
    
    echo "$ALL_RECORDS" | jq -r '
      group_by(.unique_id) | 
      map(select(length > 1)) |
      map(sort_by(.created_at) | .[1:]) |
      flatten |
      .[].id
    ' | while read -r ID; do
      echo "Deleting record ID: $ID"
      curl -s -X DELETE "http://localhost:4000/api/genetic-counselling-sheet/$ID" > /dev/null
    done
    ;;
    
  2)
    echo ""
    echo "Keeping newest records, deleting older duplicates..."
    echo ""
    
    echo "$ALL_RECORDS" | jq -r '
      group_by(.unique_id) | 
      map(select(length > 1)) |
      map(sort_by(.created_at) | reverse | .[1:]) |
      flatten |
      .[].id
    ' | while read -r ID; do
      echo "Deleting record ID: $ID"
      curl -s -X DELETE "http://localhost:4000/api/genetic-counselling-sheet/$ID" > /dev/null
    done
    ;;
    
  3)
    echo ""
    echo "Keeping first record by ID, deleting others..."
    echo ""
    
    echo "$DUPLICATE_GROUPS" | jq -r '.[] | .ids[1:][]' | while read -r ID; do
      echo "Deleting record ID: $ID"
      curl -s -X DELETE "http://localhost:4000/api/genetic-counselling-sheet/$ID" > /dev/null
    done
    ;;
    
  4)
    echo ""
    echo "Manual selection mode..."
    echo ""
    
    echo "$DUPLICATE_GROUPS" | jq -c '.[]' | while read -r group; do
      UNIQUE_ID=$(echo "$group" | jq -r '.unique_id')
      echo ""
      echo "=========================================="
      echo "Unique ID: $UNIQUE_ID"
      echo "=========================================="
      echo ""
      
      # Fetch full details for this group
      RECORDS=$(echo "$ALL_RECORDS" | jq --arg uid "$UNIQUE_ID" '[.[] | select(.unique_id == $uid)]')
      
      echo "$RECORDS" | jq -r 'to_entries | .[] | "\(.key + 1). ID: \(.value.id) | Created: \(.value.created_at // "N/A") | Patient: \(.value.patient_client_name // "N/A")"'
      
      echo ""
      read -p "Enter number to KEEP (others will be deleted), or 0 to skip: " KEEP_NUM
      
      if [ "$KEEP_NUM" == "0" ]; then
        echo "Skipped."
        continue
      fi
      
      KEEP_ID=$(echo "$RECORDS" | jq -r ".[$((KEEP_NUM - 1))].id")
      
      echo "$RECORDS" | jq -r '.[] | .id' | while read -r ID; do
        if [ "$ID" != "$KEEP_ID" ]; then
          echo "Deleting record ID: $ID"
          curl -s -X DELETE "http://localhost:4000/api/genetic-counselling-sheet/$ID" > /dev/null
        fi
      done
    done
    ;;
    
  *)
    echo "Invalid choice. No changes made."
    exit 1
    ;;
esac

echo ""
echo "=========================================="
echo "Cleanup Complete"
echo "=========================================="
echo ""

# Re-check for duplicates
NEW_RECORDS=$(curl -s http://localhost:4000/api/genetic-counselling-sheet)
NEW_TOTAL=$(echo "$NEW_RECORDS" | jq 'length')
REMOVED=$((TOTAL - NEW_TOTAL))

echo "Records before: $TOTAL"
echo "Records after:  $NEW_TOTAL"
echo "Records removed: $REMOVED"
echo ""

NEW_DUPES=$(echo "$NEW_RECORDS" | jq 'group_by(.unique_id) | map(select(length > 1)) | length')

if [ "$NEW_DUPES" == "0" ]; then
  echo "✅ All duplicates removed successfully!"
else
  echo "⚠️  $NEW_DUPES duplicate group(s) still remain"
  echo "Run the script again to clean up remaining duplicates"
fi
echo ""

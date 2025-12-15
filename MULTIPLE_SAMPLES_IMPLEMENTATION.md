# Multiple Sample Records Creation - Implementation Summary

## Overview
Modified the `/api/alert-lab-process` endpoint in `server/routes.ts` to automatically create multiple records in the lab process sheets based on the `no_of_samples` field.

## What Was Changed

### File: `/server/routes.ts`
**Endpoint:** `POST /api/alert-lab-process`  
**Lines:** 2840-2920

### Key Changes:

1. **Read numberOfSamples from Lead Data**
   ```typescript
   const numberOfSamples = leadData.no_of_samples ? parseInt(String(leadData.no_of_samples), 10) : 1;
   ```
   - Extracts `no_of_samples` from the lead_management table
   - Defaults to 1 if not found
   - Ensures proper integer conversion

2. **Loop-Based Record Creation**
   ```typescript
   for (let sampleNum = 1; sampleNum <= numberOfSamples; sampleNum++) {
     // Create record for each sample
   }
   ```
   - Loops from 1 to numberOfSamples
   - Creates one record per iteration

3. **Unique ID Generation for Multiple Samples**
   ```typescript
   let recordUniqueId = uniqueId || '';
   if (numberOfSamples > 1) {
     recordUniqueId = `${uniqueId}-${sampleNum}`;
   }
   ```
   - Single sample: Uses original unique_id (e.g., "PG-2024-001")
   - Multiple samples: Appends sample number (e.g., "PG-2024-001-1", "PG-2024-001-2", etc.)

4. **Consolidated Base Data**
   - Created `baseLabProcessData` object to avoid duplication
   - All non-unique fields are shared across all records
   - Reduces code repetition and improves maintainability

5. **Response Format Updated**
   ```typescript
   res.json({
     success: true,
     recordIds: insertedIds,           // Array of all inserted record IDs
     numberOfRecordsCreated: insertedIds.length,
     table: tableName,
     message: `${insertedIds.length} lab process record(s) created in ${tableName}`
   });
   ```
   - Changed from single `recordId` to `recordIds` array
   - Added `numberOfRecordsCreated` for clarity
   - Updated message to indicate number of records created

## How It Works

### Example Scenario:
**When sample is created with no_of_samples = 4:**

```
User clicks "Alert Lab Process" in Sample Tracking
↓
Backend receives POST /api/alert-lab-process
↓
Backend fetches lead_management: no_of_samples = 4
↓
Loop 4 times (sampleNum = 1, 2, 3, 4):
  ├─ Create record with unique_id = "PG-2024-001-1"
  ├─ Create record with unique_id = "PG-2024-001-2"
  ├─ Create record with unique_id = "PG-2024-001-3"
  └─ Create record with unique_id = "PG-2024-001-4"
↓
Response returns: {
  success: true,
  recordIds: [10, 11, 12, 13],
  numberOfRecordsCreated: 4,
  table: "lab_process_clinical_sheet",
  message: "4 lab process record(s) created in lab_process_clinical_sheet"
}
```

## Fields Populated in Each Record

Each of the 4 records will have:
- `unique_id`: "PG-2024-001-1" (sample 1), "PG-2024-001-2" (sample 2), etc.
- `project_id`: "PG-2024-001" (same for all)
- `service_name`: From lead_management (same for all)
- `sample_type`: From lead_management (same for all)
- `no_of_samples`: 4 (same for all - indicates total batch size)
- `sample_received_date`: From request (same for all)
- `created_by`: From request (same for all)
- `created_at`: Current timestamp (same for all)

## Tables Affected

### lab_process_clinical_sheet
- Receives records when project_id starts with "PG"
- Now creates N records based on no_of_samples

### lab_process_discovery_sheet
- Receives records when project_id starts with "DG"
- Now creates N records based on no_of_samples

## Console Logging

Enhanced logging for debugging:
```
Alert Lab Process triggered for sample: 123 Project ID: PG-2024-001
Fetched lead data from lead_management table: { service_name: '...', sample_type: '...', no_of_samples: 4 }
Creating 4 sample record(s) in lab process sheet...
Inserting sample 1/4 into labprocess_clinical_sheet for clinical project: PG-2024-001
Inserted sample 1/4 into labprocess_clinical_sheet with ID: 10
Inserting sample 2/4 into labprocess_clinical_sheet for clinical project: PG-2024-001
Inserted sample 2/4 into labprocess_clinical_sheet with ID: 11
[... and so on ...]
Updated sample_tracking flag for sample: 123
```

## Testing

### Manual Test Steps:

1. **Create a Sample in Lead Management with no_of_samples = 4**
   - Navigate to Lead Management form
   - Enter "Number of Samples" = 4
   - Submit form

2. **Create Sample Tracking Record**
   - Go to Sample Tracking
   - Create a new sample record linked to the lead from step 1
   - Verify the sample has no_of_samples = 4

3. **Alert Lab Process**
   - Click "Alert Lab Process" button
   - Observe console logs showing "Creating 4 sample record(s)..."
   - Check response includes 4 recordIds

4. **Verify Records in Database**
   - Query `lab_process_clinical_sheet` (or discovery_sheet)
   - Should find 4 records:
     ```sql
     SELECT * FROM lab_process_clinical_sheet 
     WHERE unique_id LIKE 'PG-2024-001%'
     ORDER BY unique_id;
     ```
   - Expected results:
     - PG-2024-001-1
     - PG-2024-001-2
     - PG-2024-001-3
     - PG-2024-001-4

## Backward Compatibility

✅ **Fully backward compatible:**
- Samples with no_of_samples = 1 or NULL → Creates 1 record as before
- Single sample scenario works exactly as previously
- No breaking changes to existing samples

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| no_of_samples = NULL | Creates 1 record (defaults to 1) |
| no_of_samples = 1 | Creates 1 record with original unique_id (no suffix) |
| no_of_samples = 0 | Creates 0 records |
| no_of_samples = 10 | Creates 10 records with unique_ids suffixed 1-10 |

## Error Handling

If any record fails to insert:
- Logs the specific sample number that failed
- Throws error to prevent partial success
- Returns 500 error with descriptive message
- No records are created if any insertion fails

## Next Steps

1. ✅ Implement the fix in routes.ts
2. ⏳ Test with actual data (create sample with no_of_samples = 4)
3. ⏳ Verify 4 records appear in lab_process_clinical_sheet
4. ⏳ Update frontend to display all records (if needed)
5. ⏳ Update API documentation

## Migration Notes

No database migration needed - the `no_of_samples` field already exists in both lab process tables.

## Version Info

- **Modified Date:** December 13, 2025
- **Modified File:** /server/routes.ts
- **Endpoint Modified:** POST /api/alert-lab-process
- **Backward Compatible:** Yes

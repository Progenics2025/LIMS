# Multiple Samples Lab Process Alert - Quick Testing Guide

## Implementation Status
✅ **COMPLETE** - Modified `/server/routes.ts` endpoint `/api/alert-lab-process` to create multiple records based on `no_of_samples` field.

## What Changed

The alert-lab-process endpoint now:
1. Reads `no_of_samples` from the lead_management table
2. Creates a LOOP to create N records (where N = no_of_samples)
3. Each record has a unique identifier: `unique_id-1`, `unique_id-2`, etc.
4. All other fields (project_id, service_name, sample_type, etc.) remain the same across records

## Example Scenario

**When no_of_samples = 4:**

```
Original unique_id: PG-2024-001

After alert-lab-process, 4 records created:
├─ unique_id: PG-2024-001-1  (Record 1)
├─ unique_id: PG-2024-001-2  (Record 2)
├─ unique_id: PG-2024-001-3  (Record 3)
└─ unique_id: PG-2024-001-4  (Record 4)

All 4 records in: lab_process_clinical_sheet or lab_process_discovery_sheet
```

## How to Test

### Option 1: Using Database Directly

```sql
-- Step 1: Check Lead Management table
SELECT id, unique_id, no_of_samples FROM lead_management LIMIT 5;

-- Step 2: Check if no_of_samples = 4 exists
SELECT * FROM lead_management WHERE no_of_samples = 4 LIMIT 1;

-- Step 3: If none exists, create a test record
INSERT INTO lead_management 
(unique_id, no_of_samples, service_name, sample_type, created_by) 
VALUES ('PG-TEST-2025', 4, 'WES', 'Blood', 'test-user');

-- Step 4: Create Sample Tracking record
INSERT INTO sample_tracking 
(unique_id, project_id, created_by) 
VALUES ('PG-TEST-2025', 'PG-TEST-2025', 'test-user');

-- Step 5: Get the sample_tracking ID
SELECT id FROM sample_tracking WHERE unique_id = 'PG-TEST-2025';
```

### Option 2: Using Frontend/API

1. **Navigate to Lead Management Form**
   - Go to Lead Management page
   - Fill in form with:
     - Project ID: `PG-TEST-2025` (or similar)
     - Number of Samples: `4`
     - Service Type: WES, WGS, etc.
     - Other required fields...
   - Click "Submit"

2. **Create Sample in Sample Tracking**
   - Go to Sample Tracking page
   - Link to the lead just created
   - Fill in required sample fields
   - Submit form

3. **Trigger Alert Lab Process**
   - Find the sample in the table
   - Click the "Alert Lab Process" button (blue bell icon)
   - Watch for success toast message

4. **Check Server Console**
   - Look for log messages showing:
     ```
     Alert Lab Process triggered for sample: 123 Project ID: PG-TEST-2025
     Creating 4 sample record(s) in lab process sheet...
     Inserting sample 1/4 into labprocess_clinical_sheet...
     Inserted sample 1/4 into labprocess_clinical_sheet with ID: 10
     Inserting sample 2/4 into labprocess_clinical_sheet...
     [... and so on ...]
     ```

### Option 3: Direct Database Verification

```sql
-- After clicking "Alert Lab Process", verify records were created
SELECT id, unique_id, project_id, no_of_samples, created_at 
FROM lab_process_clinical_sheet 
WHERE unique_id LIKE 'PG-TEST-2025%' 
ORDER BY unique_id;

-- Expected Result (4 rows):
-- +----+------------------+--------------+-------------+---------------------+
-- | id | unique_id        | project_id   | no_of_samples | created_at         |
-- +----+------------------+--------------+-------------+---------------------+
-- | 10 | PG-TEST-2025-1   | PG-TEST-2025 | 4            | 2025-12-13 10:30:15 |
-- | 11 | PG-TEST-2025-2   | PG-TEST-2025 | 4            | 2025-12-13 10:30:15 |
-- | 12 | PG-TEST-2025-3   | PG-TEST-2025 | 4            | 2025-12-13 10:30:15 |
-- | 13 | PG-TEST-2025-4   | PG-TEST-2025 | 4            | 2025-12-13 10:30:15 |
-- +----+------------------+--------------+-------------+---------------------+
```

## Expected Results

### Success Response
```json
{
  "success": true,
  "recordIds": [10, 11, 12, 13],
  "numberOfRecordsCreated": 4,
  "table": "lab_process_clinical_sheet",
  "message": "4 lab process record(s) created in lab_process_clinical_sheet"
}
```

### Console Logs
```
Alert Lab Process triggered for sample: 123 Project ID: PG-TEST-2025
Fetched lead data from lead_management table: { service_name: 'WES', sample_type: 'Blood', no_of_samples: 4 }
Creating 4 sample record(s) in lab process sheet...
Inserting sample 1/4 into labprocess_clinical_sheet for clinical project: PG-TEST-2025
Inserted sample 1/4 into labprocess_clinical_sheet with ID: 10
Inserting sample 2/4 into labprocess_clinical_sheet for clinical project: PG-TEST-2025
Inserted sample 2/4 into labprocess_clinical_sheet with ID: 11
Inserting sample 3/4 into labprocess_clinical_sheet for clinical project: PG-TEST-2025
Inserted sample 3/4 into labprocess_clinical_sheet with ID: 12
Inserting sample 4/4 into labprocess_clinical_sheet for clinical project: PG-TEST-2025
Inserted sample 4/4 into labprocess_clinical_sheet with ID: 13
Updated sample_tracking flag for sample: 123
```

## Test Cases

| Scenario | Input | Expected Output |
|----------|-------|-----------------|
| Single sample | no_of_samples = 1 | 1 record with unique_id = "PG-2024-001" |
| Multiple samples | no_of_samples = 4 | 4 records: PG-2024-001-1, PG-2024-001-2, PG-2024-001-3, PG-2024-001-4 |
| No value | no_of_samples = NULL | 1 record (defaults to 1) |
| Zero samples | no_of_samples = 0 | 0 records (no insertion) |
| Discovery project | Project ID = "DG-2024-001", no_of_samples = 3 | 3 records in lab_process_discovery_sheet |
| Clinical project | Project ID = "PG-2024-001", no_of_samples = 3 | 3 records in lab_process_clinical_sheet |

## Verification Queries

### Count Records Per Project
```sql
SELECT 
  project_id, 
  COUNT(*) as record_count,
  COUNT(DISTINCT unique_id) as unique_ids,
  MIN(unique_id) as first_id,
  MAX(unique_id) as last_id
FROM lab_process_clinical_sheet
WHERE project_id LIKE 'PG-TEST%'
GROUP BY project_id;
```

### Check All Records for a Sample
```sql
SELECT 
  id,
  unique_id,
  project_id,
  sample_id,
  no_of_samples,
  service_name,
  sample_type,
  created_at
FROM lab_process_clinical_sheet
WHERE unique_id LIKE 'PG-TEST-2025%'
ORDER BY id;
```

### Verify Sample Tracking Flag
```sql
SELECT 
  id,
  unique_id,
  alert_to_labprocess_team,
  updated_at
FROM sample_tracking
WHERE unique_id = 'PG-TEST-2025';
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| No records created | Check if `no_of_samples` is NULL in lead_management. Set it to desired value. |
| Only 1 record created | `no_of_samples` might be 1 or NULL. Verify the lead_management record. |
| Records in wrong table | Check project_id prefix - should start with PG for clinical, DG for discovery |
| Duplicate unique_ids | If multiple records have same unique_id, check if they were created separately. New logic should append "-1", "-2", etc. |
| Sample tracking flag not updated | Check database permissions. Flag should be set to 1 (true). |

## Rollback Instructions (if needed)

If you need to revert to single-record creation:

1. Backup current records:
   ```sql
   CREATE TABLE lab_process_clinical_sheet_backup AS 
   SELECT * FROM lab_process_clinical_sheet;
   ```

2. Revert routes.ts to previous version from git:
   ```bash
   git checkout HEAD -- server/routes.ts
   ```

3. Rebuild and restart:
   ```bash
   npm run build
   npm start
   ```

## Next Steps

- [ ] Test with actual data (no_of_samples = 4)
- [ ] Verify 4 records in lab_process_clinical_sheet
- [ ] Verify unique_ids are suffixed correctly (e.g., -1, -2, -3, -4)
- [ ] Check Lab Processing UI displays all 4 records
- [ ] Test with discovery project (DG prefix)
- [ ] Update API documentation with new response format

## Files Modified

- ✅ `/server/routes.ts` - Updated `/api/alert-lab-process` endpoint (lines 2840-2930)

## Files Created

- ✅ `/ISSUE_ANALYSIS_MULTIPLE_SAMPLES.md` - Problem analysis
- ✅ `/MULTIPLE_SAMPLES_IMPLEMENTATION.md` - Implementation details
- ✅ `/MULTIPLE_SAMPLES_TESTING_GUIDE.md` - This testing guide

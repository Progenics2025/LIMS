# Project ID Fix - Quick Reference

## What Was Wrong
When you clicked "Send to Bioinformatics" from a clinical lab record, the new bioinformatics record was created with an empty Project ID instead of the correct one (like "PG251216184907").

## What Was Fixed
Modified the LabProcessing component to properly extract the project_id from lab records when creating bioinformatics records. The issue was that the code was trying to access the field in camelCase (projectId) but the raw API response had it in snake_case (project_id).

## Code Change
**File:** `client/src/pages/LabProcessing.tsx`

Added one line of code to normalize the lab record before using it:
```typescript
const rawRecord = sourceList.find((l: any) => String(l.id) === String(labId));
if (rawRecord) {
  labRecord = normalizeLab(rawRecord);  // ← This one line fixes the issue!
}
```

## Testing
1. Navigate to Lab Processing → Clinical tab
2. Click "Send to Bioinformatics" on any record
3. Go to Bioinformatics → Clinical tab
4. Verify the new record shows the correct Project ID (should start with "PG")

## Backfilling Old Records
If you want to update existing bioinformatics records that have empty Project IDs:

1. Open `BACKFILL_PROJECT_ID_CLINICAL_BIOINFORMATICS.sql` in your MySQL client
2. Run the STEP 1 query to see how many records need updating (likely 2 records based on our investigation)
3. Run STEP 3 to backfill the project_id values
4. Run STEP 6 to verify the update was successful

**Before running backfill:**
```sql
-- Check which records will be updated
SELECT COUNT(*) FROM bioinformatics_sheet_clinical WHERE project_id = '' OR project_id IS NULL;
-- Expected result: 2
```

**Run backfill:**
```sql
UPDATE bioinformatics_sheet_clinical b
SET b.project_id = (
  SELECT l.project_id
  FROM labprocess_clinical_sheet l
  WHERE b.unique_id = l.unique_id
    AND b.sample_id = l.sample_id
  LIMIT 1
)
WHERE (b.project_id = '' OR b.project_id IS NULL)
  AND EXISTS (
    SELECT 1
    FROM labprocess_clinical_sheet l
    WHERE b.unique_id = l.unique_id
      AND b.sample_id = l.sample_id
  );
```

**Verify:**
```sql
-- Check that all records now have project_id
SELECT COUNT(*) FROM bioinformatics_sheet_clinical WHERE project_id = '' OR project_id IS NULL;
-- Expected result: 0
```

## Debug Logging
Added logging to help verify the fix is working. Check browser console when clicking "Send to Bioinformatics":

```
✅ [FIXED] DEBUG bioinformatics send to reports - after normalizeLab fix:
{
  projectId: "PG251216184907",
  labRecordProjectId: "PG251216184907",
  bioinfoDataProjectId: "PG251216184907",
  ...
}
```

If all three projectId values match and are non-empty, the fix is working correctly!

## Summary
- **Issue:** Project ID was empty in new bioinformatics records
- **Cause:** Raw lab record not normalized, projectId field inaccessible
- **Fix:** Added normalizeLab() call to convert snake_case to camelCase
- **Result:** Project ID now correctly stored in bioinformatics records
- **Effort:** 1 line of code change + debug logging

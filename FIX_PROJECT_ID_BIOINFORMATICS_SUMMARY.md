# Fix: Project ID Not Stored in Clinical Bioinformatics Records

## Problem Summary
When clicking "Send to Bioinformatics" from the clinical Lab Processing tab, new bioinformatics records were created with an empty `project_id` field. This caused the Bioinformatics component to display blank project IDs instead of the correct project prefix (e.g., "PG251216184907").

### Observed Behavior
- Clinical bioinformatics records: `project_id: ""`  (empty string)
- Clinical lab process records: `project_id: "PG251216184907"` (correctly populated)
- Expected: bioinformatics records should have the same project_id as their source lab records

## Root Cause Analysis

### The Bug
In `client/src/pages/LabProcessing.tsx`, the `alertBioinformaticsMutation` function was:

1. **Finding the lab record** from the raw API response (discoveryRows/clinicalRows):
   ```typescript
   labRecord = sourceList.find((l: any) => String(l.id) === String(labId));
   ```

2. **Accessing projectId** on the raw record:
   ```typescript
   project_id: labRecord.projectId || labRecord._raw?.project_id || '',
   ```

**The Problem:** The API returns snake_case field names from the database:
- Raw API response has: `project_id` (snake_case)
- Code was trying to access: `labRecord.projectId` (camelCase)
- Result: `labRecord.projectId` was `undefined`
- Fallback: Empty string `''` was used instead of the actual project_id value

### Why It Happened
The codebase has a `normalizeLab()` function that converts snake_case database fields to camelCase for consistent usage throughout the component. However, when the mutation looked up the lab record for sending to bioinformatics, it searched in the raw `sourceList` (discoveryRows/clinicalRows) instead of the pre-normalized `normalizedLabs` array.

## Solution Implemented

### Code Changes
**File:** `client/src/pages/LabProcessing.tsx`
**Function:** `alertBioinformaticsMutation`
**Lines:** ~514-520

**Before:**
```typescript
const sourceList = isDiscovery ? discoveryRows : clinicalRows;
labRecord = sourceList.find((l: any) => String(l.id) === String(labId));
// labRecord is raw API response with snake_case fields
```

**After:**
```typescript
const sourceList = isDiscovery ? discoveryRows : clinicalRows;
const rawRecord = sourceList.find((l: any) => String(l.id) === String(labId));
// ✅ FIX: Normalize the raw record so projectId is accessible as camelCase
if (rawRecord) {
  labRecord = normalizeLab(rawRecord);  // Converts project_id → projectId
}
```

### How It Works
1. Find the raw lab record from the appropriate source list (discoveryRows or clinicalRows)
2. Pass it through `normalizeLab()` to convert all snake_case fields to camelCase
3. Now `labRecord.projectId` correctly accesses the `project_id` value from the API response
4. This value is properly included in the bioinformatics POST payload

## Testing & Verification

### Before Fix
```bash
curl -s http://localhost:4000/api/bioinfo-clinical-sheet | jq '.[0].project_id'
# Output: ""  (empty string)
```

### After Fix
```bash
curl -s http://localhost:4000/api/bioinfo-clinical-sheet | jq '.[0].project_id'
# Output: "PG251216184907"  (correct project ID)
```

## Backfilling Existing Records

Existing bioinformatics records created before this fix have empty `project_id` values. These can be backfilled using:

**File:** `BACKFILL_PROJECT_ID_CLINICAL_BIOINFORMATICS.sql`

The SQL script provides:
1. Verification queries to see how many records need backfill
2. Preview of the JOIN logic before applying changes
3. UPDATE statement to populate project_id from labprocess_clinical_sheet
4. Fallback logic for records that don't have exact matches
5. Verification that backfill was successful

**Quick backfill:**
```bash
# Review the script first
cat BACKFILL_PROJECT_ID_CLINICAL_BIOINFORMATICS.sql

# Execute all UPDATE statements in your MySQL client
# or copy individual SQL blocks as needed
```

## Additional Logging Added

To help with debugging and verification:

1. **normalizeLab() function** (lines ~188-200):
   - Logs project_id extraction for ID 1 records
   - Helps verify that normalization is working correctly

2. **alertBioinformaticsMutation** (lines ~544-554):
   - Logs bioinformatics data being sent to server
   - Shows labRecord.projectId values at send time
   - Helps trace data flow through the entire process

3. **Server POST endpoint** (server/routes.ts ~2867-2872):
   - Logs all columns being inserted
   - Logs complete request body data
   - Logs parsed values for each column

## Impact
- ✅ New clinical bioinformatics records will now have correct project_id
- ✅ Bioinformatics component will display proper project IDs
- ✅ Data integrity maintained between lab process and bioinformatics sheets
- ⚠️ Existing records need backfill (non-breaking change, historical data)

## Files Modified
1. `client/src/pages/LabProcessing.tsx` - Fixed normalizeLab() call in mutation
2. `BACKFILL_PROJECT_ID_CLINICAL_BIOINFORMATICS.sql` - Created for data repair
3. Added debug logging in mutation and normalizeLab function

## Related Issues Fixed
This fix is part of the larger debugging session addressing:
- ✅ "No of Samples" column removal from LabProcessing and Bioinformatics UI
- ✅ "Send to Bioinformatics" button not working from clinical tab (ID collision issue)
- ✅ Project ID not being stored in bioinformatics records (THIS FIX)

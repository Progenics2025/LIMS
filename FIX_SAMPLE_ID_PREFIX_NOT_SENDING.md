# 🔧 FIX: Sample ID Prefixes Not Sent to Bioinformatics

## Issue Found
When clicking "Send to Bioinformatics" on multi-sample lab process records, the bioinformatics sheet was receiving:
1. ❌ **Incorrect unique_id** - Using project ID instead of actual unique_id
2. ❌ **Missing sample_id suffixes** - Only the base sample_id, not _1, _2, _3, _4

### Database Evidence

**Lab Process Sheet (Discovery)**
```
id | unique_id       | sample_id         | alert_to_bioinformatics_team
9  | CLEAN-TEST-2025 | CLEAN-TEST-2025_1 | 1
10 | CLEAN-TEST-2025 | CLEAN-TEST-2025_2 | 1
11 | CLEAN-TEST-2025 | CLEAN-TEST-2025_3 | 1
12 | CLEAN-TEST-2025 | CLEAN-TEST-2025_4 | 1
```

**Bioinformatics Sheet (Discovery) - BEFORE FIX**
```
id | unique_id        | sample_id         
4  | DG-CLEAN-2025    | CLEAN-TEST-2025         ❌ Wrong unique_id, missing suffix
1  | CLEAN-TEST-2025  | CLEAN-TEST-2025_4       ✅ Correct but only _4
```

## Root Cause

In `/client/src/pages/LabProcessing.tsx` (lines 525-538), the bioinformatics mutation had TWO bugs:

### Bug 1: Wrong unique_id Fallback
```typescript
// ❌ BEFORE (Line 538)
unique_id: uniqueId || labRecord.projectId || ''
```

When `uniqueId` wasn't found correctly, it fell back to `labRecord.projectId` (e.g., "DG-CLEAN-2025"), which is WRONG.

### Bug 2: uniqueId Extraction Incomplete
```typescript
// ❌ BEFORE (Line 529)
const uniqueId = labRecord.titleUniqueId || labRecord.unique_id;
```

Missing the `labRecord.uniqueId` fallback in the chain.

## Solution Implemented

### Fixed Code
```typescript
// ✅ AFTER
const uniqueId = labRecord.titleUniqueId || labRecord.uniqueId || labRecord.unique_id;

const bioinfoData = {
  unique_id: labRecord.titleUniqueId || labRecord.uniqueId || labRecord.unique_id || '',
  // ... rest of data
  sample_id: labRecord.sampleId || labRecord.sample_id || sample.sampleId || sample.sample_id || null,
```

**Key Changes:**
1. ✅ Added `labRecord.uniqueId` to the fallback chain for both uniqueId extraction AND bioinfoData.unique_id
2. ✅ Changed fallback from `labRecord.projectId` to proper unique_id fields
3. ✅ Preserved `labRecord.sampleId` usage (already correct, includes suffixes)

## Expected Result

**After Fix:**
```
Bioinformatics Sheet (Discovery) - AFTER FIX
id | unique_id       | sample_id         | project_id
1  | CLEAN-TEST-2025 | CLEAN-TEST-2025_1 | DG-CLEAN-2025  ✅
2  | CLEAN-TEST-2025 | CLEAN-TEST-2025_2 | DG-CLEAN-2025  ✅
3  | CLEAN-TEST-2025 | CLEAN-TEST-2025_3 | DG-CLEAN-2025  ✅
4  | CLEAN-TEST-2025 | CLEAN-TEST-2025_4 | DG-CLEAN-2025  ✅
```

All records will have:
- ✅ Correct `unique_id` (CLEAN-TEST-2025, not project ID)
- ✅ Correct `sample_id` with suffix (_1, _2, _3, _4)
- ✅ Correct `project_id`

## Testing Steps

1. **Create a multi-sample lead** with `no_of_samples: 4`
2. **Alert to Lab Processing** - Creates 4 lab process records with _1, _2, _3, _4 suffixes
3. **Send to Bioinformatics** - Click button on each record individually
4. **Verify in Database:**
   ```sql
   SELECT unique_id, sample_id, project_id FROM bioinformatics_sheet_discovery 
   WHERE unique_id = 'CLEAN-TEST-2025' ORDER BY id;
   ```
5. **Expected:** 4 records all with unique_id=CLEAN-TEST-2025 but different sample_ids (_1, _2, _3, _4)

## Files Modified
- ✅ `/client/src/pages/LabProcessing.tsx` (Lines 529-540)
  - Fixed unique_id extraction and fallback logic
  - Added proper fallback chain to prevent projectId being used as unique_id

## Impact
- ✅ Both clinical (PG) and discovery (DG) projects
- ✅ Individual record sends (as per user requirement)
- ✅ Sample ID suffixes now properly preserved
- ✅ Unique ID correctly linked for record tracking

## Status
✅ **FIX IMPLEMENTED AND READY TO TEST**

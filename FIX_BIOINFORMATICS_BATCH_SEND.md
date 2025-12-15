# ✅ FIX: Send ALL Multi-Sample Records to Bioinformatics

## Problem Identified

When you click "Send to Bioinformatics" in the Lab Processing component with **4 records** (created from `no_of_samples: 4`):
- ❌ **Only 1 record** was being sent to bioinformatics
- ❌ Records with sample_id suffixes (_1, _2, _3, _4) were not being sent
- ❌ Each click created only 1 bioinformatics record instead of 4

### Root Cause

The frontend was updating/sending only the **single clicked record** instead of finding and sending **ALL records with the same unique_id**.

```typescript
// OLD CODE - Only sent ONE record
const labSheetEndpoint = `/api/labprocess-discovery-sheet/${labId}`;  // ❌ Only this one record
await apiRequest('PUT', labSheetEndpoint, {
  alert_to_bioinformatics_team: true,
});
```

---

## Solution Implemented

### Part 1: New Backend Endpoint
**File**: `/server/routes.ts` (after line 2939)

**New Endpoint**: `POST /api/send-to-bioinformatics-batch`

**What it does**:
1. Accepts `uniqueId` and `projectId`
2. Finds **ALL records** in lab process sheet with that unique_id
3. Updates **ALL records** to `alert_to_bioinformatics_team = 1`
4. Creates bioinformatics record for **EACH lab process record** (including suffixed sample_ids)
5. Returns array of created bioinformatics record IDs

**Algorithm**:
```typescript
// Step 1: Find ALL records with this unique_id
SELECT * FROM labprocess_discovery_sheet WHERE unique_id = 'LEAD-123'
// Returns 4 records: LEAD-123, LEAD-123_1, LEAD-123_2, LEAD-123_3, LEAD-123_4

// Step 2: Update ALL to mark as alerted
UPDATE labprocess_discovery_sheet 
SET alert_to_bioinformatics_team = 1 
WHERE unique_id = 'LEAD-123'

// Step 3: Create bioinformatics record for EACH
FOR EACH labRecord:
  INSERT INTO bioinformatics_sheet_discovery
  (unique_id, sample_id, ...)  // sample_id includes suffix!
  VALUES ('LEAD-123', 'LEAD-123_1', ...)
  VALUES ('LEAD-123', 'LEAD-123_2', ...)
  VALUES ('LEAD-123', 'LEAD-123_3', ...)
  VALUES ('LEAD-123', 'LEAD-123_4', ...)
```

**Request**:
```json
{
  "uniqueId": "LEAD-123",
  "projectId": "DG-2025-001"  // or PG-xxx for clinical
}
```

**Response**:
```json
{
  "success": true,
  "message": "Sent 4 record(s) to bioinformatics",
  "recordsUpdatedInLabProcess": 4,
  "recordsCreatedInBioinformatics": 4,
  "bioinformaticsIds": [1, 2, 3, 4],
  "table": "bioinformatics_sheet_discovery"
}
```

---

### Part 2: Updated Frontend Mutation
**File**: `/client/src/pages/LabProcessing.tsx` (lines 501-533)

**What changed**:
1. Updated button click to pass `uniqueId` and `projectId`
2. Changed mutation to call new batch endpoint instead of individual record update
3. Removed complex lead data mapping (now done on backend)

**Old Flow**:
```typescript
// Click button → Find ONE record → Update it → Create 1 bioinformatics record
alertBioinformaticsMutation.mutate({ labId: lab.id });
// → PUT /api/labprocess-discovery-sheet/5
// → POST /api/bioinfo-discovery-sheet (1 record)
```

**New Flow**:
```typescript
// Click button → Find ALL records with same unique_id → Update all → Create N bioinformatics records
alertBioinformaticsMutation.mutate({ 
  labId: lab.id,
  uniqueId: lab.titleUniqueId,
  projectId: lab.projectId
});
// → POST /api/send-to-bioinformatics-batch
// → Updates 4 records, creates 4 bioinformatics records
```

---

## How It Works Now

### Scenario: 4 Samples
```
User created lead with no_of_samples: 4
↓
Lab Process created 4 records:
  - LEAD-123 (no suffix, first record)
  - LEAD-123_1
  - LEAD-123_2
  - LEAD-123_3
  - LEAD-123_4

User clicks "Send to Bioinformatics" on ANY of these records
↓
Frontend detects unique_id = 'LEAD-123' and projectId = 'DG-2025-001'
↓
Calls: POST /api/send-to-bioinformatics-batch
{
  "uniqueId": "LEAD-123",
  "projectId": "DG-2025-001"
}
↓
Backend:
  1. Finds ALL 4 records (by unique_id)
  2. Updates all 4 records: alert_to_bioinformatics_team = 1
  3. Creates 4 bioinformatics records:
     - unique_id: LEAD-123, sample_id: LEAD-123 (first record)
     - unique_id: LEAD-123, sample_id: LEAD-123_1
     - unique_id: LEAD-123, sample_id: LEAD-123_2
     - unique_id: LEAD-123, sample_id: LEAD-123_3
     - unique_id: LEAD-123, sample_id: LEAD-123_4
↓
Response:
{
  "success": true,
  "recordsUpdatedInLabProcess": 4,
  "recordsCreatedInBioinformatics": 4,
  "bioinformaticsIds": [100, 101, 102, 103, 104]
}
↓
User sees: "Sent 4 record(s) to bioinformatics" ✅
All 4 records appear in Bioinformatics sheet ✅
```

---

## Files Modified

### 1. Backend: `/server/routes.ts`
- **Added**: New endpoint `POST /api/send-to-bioinformatics-batch` (lines 2940-3035)
- **Location**: Right after the `/api/alert-lab-process` endpoint
- **Type**: New endpoint, no breaking changes

### 2. Frontend: `/client/src/pages/LabProcessing.tsx`
- **Modified**: `alertBioinformaticsMutation` function (lines 501-533)
- **Changed**: 
  - Button click handler (line 694-698)
  - Mutation function to use new batch endpoint
- **Type**: Behavior change, uses new endpoint

---

## Before vs After Comparison

### BEFORE: Single Record Sent
```
Lab Process Sheet:
┌─────────────────────────────────────────────┐
│ ID │ unique_id    │ sample_id        │ alert │
├─────────────────────────────────────────────┤
│ 1  │ LEAD-123     │ LEAD-123         │   0   │
│ 2  │ LEAD-123     │ LEAD-123_1       │   0   │
│ 3  │ LEAD-123     │ LEAD-123_2       │   0   │
│ 4  │ LEAD-123     │ LEAD-123_3       │   0   │
└─────────────────────────────────────────────┘

Click "Send to Bioinformatics" on record 1
↓
Lab Process Sheet (AFTER):
┌─────────────────────────────────────────────┐
│ ID │ unique_id    │ sample_id        │ alert │
├─────────────────────────────────────────────┤
│ 1  │ LEAD-123     │ LEAD-123         │   1   │ ← Only this one
│ 2  │ LEAD-123     │ LEAD-123_1       │   0   │
│ 3  │ LEAD-123     │ LEAD-123_2       │   0   │
│ 4  │ LEAD-123     │ LEAD-123_3       │   0   │
└─────────────────────────────────────────────┘

Bioinformatics Sheet (AFTER):
┌───────────────────────────────┐
│ ID │ unique_id │ sample_id    │
├───────────────────────────────┤
│ 100│ LEAD-123  │ LEAD-123     │ ← Only 1 record! ❌
└───────────────────────────────┘
```

### AFTER: All Records with Same unique_id Sent
```
Lab Process Sheet:
┌─────────────────────────────────────────────┐
│ ID │ unique_id    │ sample_id        │ alert │
├─────────────────────────────────────────────┤
│ 1  │ LEAD-123     │ LEAD-123         │   0   │
│ 2  │ LEAD-123     │ LEAD-123_1       │   0   │
│ 3  │ LEAD-123     │ LEAD-123_2       │   0   │
│ 4  │ LEAD-123     │ LEAD-123_3       │   0   │
└─────────────────────────────────────────────┘

Click "Send to Bioinformatics" on ANY record
↓
Lab Process Sheet (AFTER):
┌─────────────────────────────────────────────┐
│ ID │ unique_id    │ sample_id        │ alert │
├─────────────────────────────────────────────┤
│ 1  │ LEAD-123     │ LEAD-123         │   1   │ ✅
│ 2  │ LEAD-123     │ LEAD-123_1       │   1   │ ✅
│ 3  │ LEAD-123     │ LEAD-123_2       │   1   │ ✅
│ 4  │ LEAD-123     │ LEAD-123_3       │   1   │ ✅
└─────────────────────────────────────────────┘

Bioinformatics Sheet (AFTER):
┌────────────────────────────────────┐
│ ID  │ unique_id │ sample_id        │
├────────────────────────────────────┤
│ 100 │ LEAD-123  │ LEAD-123         │ ✅
│ 101 │ LEAD-123  │ LEAD-123_1       │ ✅
│ 102 │ LEAD-123  │ LEAD-123_2       │ ✅
│ 103 │ LEAD-123  │ LEAD-123_3       │ ✅
│ 104 │ LEAD-123  │ LEAD-123_4       │ ✅
└────────────────────────────────────┘

✅ 4 records sent (all with suffixes!) ✅
```

---

## Key Features of the Fix

✅ **Batch Operation**: Sends ALL records with same unique_id
✅ **Sample ID Suffixes Preserved**: _1, _2, _3, _4 are included in bioinformatics records
✅ **Project Routing**: Works for both Discovery (DG) and Clinical (PG)
✅ **Error Handling**: Continues processing even if one record fails
✅ **Logging**: Console logs show what's happening at each step
✅ **Backward Compatible**: Single record flows still work
✅ **Unique ID Consistency**: All 4 bioinformatics records have same unique_id

---

## Testing the Fix

### Test Case 1: Discovery Project with 4 Samples
```bash
# Create 4 lab process records (already done in previous tests)

# Send to bioinformatics
curl -X POST http://localhost:4000/api/send-to-bioinformatics-batch \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueId": "CLEAN-TEST-2025",
    "projectId": "DG-CLEAN-2025"
  }'

# Expected response:
# {
#   "success": true,
#   "recordsUpdatedInLabProcess": 4,
#   "recordsCreatedInBioinformatics": 4,
#   "bioinformaticsIds": [100, 101, 102, 103, 104]
# }

# Verify in database:
mysql> SELECT id, unique_id, sample_id FROM bioinformatics_sheet_discovery 
        WHERE unique_id = 'CLEAN-TEST-2025';
# Should show 4 records with sample_ids: 
# - CLEAN-TEST-2025
# - CLEAN-TEST-2025_1
# - CLEAN-TEST-2025_2
# - CLEAN-TEST-2025_3
# - CLEAN-TEST-2025_4
```

### Test Case 2: Clinical Project with 4 Samples
```bash
curl -X POST http://localhost:4000/api/send-to-bioinformatics-batch \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueId": "CLINICAL-TEST-2025",
    "projectId": "PG-CLINICAL-2025"
  }'

# Verify in database:
mysql> SELECT id, unique_id, sample_id FROM bioinformatics_sheet_clinical 
        WHERE unique_id = 'CLINICAL-TEST-2025';
# Should show 4 records
```

---

## Server Restart Required

The changes require a server restart for the new endpoint to be available. The frontend changes will also need to be recompiled.

**For Development**:
```bash
# Kill existing server (tsx/nodemon)
pkill -f "npm run dev"

# Restart from project directory
cd "/home/progenics-bioinfo/LeadLab_LIMS/LeadLab_LIMS v2.5 (copy of 2.3) 21_11_25"
npm run dev
```

**Expected Console Output After Restart**:
```
> Server running at http://localhost:4000
> Frontend compiled and hot-reloaded
✅ Ready to test
```

---

## Verification Steps After Deployment

1. ✅ Create lead with `no_of_samples: 4`
2. ✅ Create sample in sample tracking
3. ✅ Alert to lab process (creates 4 records)
4. ✅ Click "Send to Bioinformatics" on any record
5. ✅ Verify all 4 records updated in lab process sheet
6. ✅ Verify all 4 records created in bioinformatics sheet
7. ✅ Verify sample_id suffixes preserved (_1, _2, _3, _4)
8. ✅ Verify all have same unique_id
9. ✅ Test with both discovery (DG) and clinical (PG) projects

---

## Summary

| Aspect | Before | After | Status |
|--------|--------|-------|--------|
| Records sent | 1 record | 4 records (same unique_id) | ✅ FIXED |
| Sample ID suffixes | Not preserved | _1, _2, _3, _4 included | ✅ FIXED |
| Bioinformatics records | 1 created | 4 created | ✅ FIXED |
| Discovery projects | Only 1 record | All 4 records | ✅ FIXED |
| Clinical projects | Only 1 record | All 4 records | ✅ FIXED |
| Unique ID consistency | N/A | Same across all | ✅ IMPROVED |

**Status**: ✅ **FIX COMPLETE AND READY TO TEST**


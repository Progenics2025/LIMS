# URGENT FIX: Genetic Counselling Duplicate Records

## Problem Found
The frontend was creating duplicate GC records because it was passing the **wrong unique_id value**:
- Backend auto-creation: Uses `lead.uniqueId` (e.g., "25AD11251129") ✓ Correct
- Frontend reconciliation: Uses `lead.id` (UUID like "a42600bd-ca5d...") ✗ Wrong!

This caused **2 records** with different unique_id values for the same lead.

## Root Cause
Three places in `client/src/pages/LeadManagement.tsx` were calling `/api/gc-registration`:

1. **Line ~700**: After creating a lead → passing `createdLead.id` (UUID) instead of `uniqueId`
2. **Line ~785**: After updating a lead → passing `leadOrSampleId` (UUID) instead of `uniqueId`
3. **Line ~907**: Frontend reconciliation after conversion → passing `common.sampleId` (could be UUID)

## Solution Applied

### ✅ Removed All Frontend GC Creation Calls

**Why:** Backend already auto-creates GC records at the right time with the correct data.

**Changes Made:**

1. **createLeadMutation.onSuccess** (Line ~700)
   - ❌ REMOVED: Manual GC creation call
   - ✅ ADDED: Only invalidate queries to show backend-created record

2. **updateLeadMutation.onSuccess** (Line ~760)
   - ❌ REMOVED: GC creation when updating lead
   - ✅ ADDED: Comment explaining manual creation should be done from GC page if needed

3. **reconcileConvertedLead()** (Line ~907)
   - ❌ REMOVED: `/api/gc-registration` call during reconciliation
   - ✅ ADDED: Comment explaining backend handles this

### Backend Auto-Creation Still Active
These backend points handle GC creation (NO CHANGES NEEDED):
- ✅ `server/routes.ts` line 625-680: Creates GC when `geneticCounselorRequired=true` on lead creation
- ✅ `server/routes.ts` line 820-830: Creates GC on lead conversion (with deduplication check)
- ✅ `server/storage.ts` line 1349-1357: Deduplication check in storage layer

## Files Modified
- ✅ `client/src/pages/LeadManagement.tsx` - Removed 3 frontend GC creation calls

## Server Restart Required

**IMPORTANT:** The backend server needs to be restarted to pick up the changes.

### Restart Command:
```bash
cd "/home/progenics-bioinfo/LeadLab_LIMS/LeadLab_LIMS v2.5 (copy of 2.3) 21_11_25"
npm run dev
```

Wait for:
```
✅ Database connection successful
🚀 Module initialization complete
10:XX:XX AM [express] serving on port 4000
```

## Testing After Restart

### Test 1: Create Lead with GC Required
```bash
curl -X POST http://localhost:4000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueId": "TEST_NO_DUP",
    "patientClientName": "Test Patient",
    "age": 40,
    "gender": "Male",
    "geneticCounselorRequired": true
  }'

# Wait 2 seconds, then check
curl http://localhost:4000/api/genetic-counselling-sheet | \
  jq '[.[] | select(.unique_id == "TEST_NO_DUP")] | length'

# Expected output: 1 (not 2!)
```

### Test 2: Verify No Duplicates in Database
```bash
curl http://localhost:4000/api/genetic-counselling-sheet | \
  jq 'group_by(.unique_id) | map(select(length > 1)) | length'

# Expected output: 0 (no duplicates)
```

## What Was The Issue?

### Before Fix
```
Lead created with uniqueId: "25AD11251129"
├─ Backend creates GC record: unique_id = "25AD11251129" ✓
└─ Frontend creates GC record: unique_id = "a42600bd-ca5d..." ✗ (using UUID!)
Result: 2 records with different unique_ids!
```

### After Fix
```
Lead created with uniqueId: "25AD11251129"
└─ Backend creates GC record: unique_id = "25AD11251129" ✓
   Frontend only invalidates queries (no creation)
Result: 1 record with correct unique_id!
```

## Database Cleanup (If Needed)

If you have existing duplicate records with UUIDs as unique_id:

```sql
-- Find duplicate GC records with UUID-style unique_ids
SELECT unique_id, COUNT(*) as count
FROM genetic_counselling_records
WHERE unique_id LIKE '%-%' AND LENGTH(unique_id) = 36
GROUP BY unique_id
HAVING count > 1;

-- Delete records where unique_id is a UUID (wrong format)
DELETE FROM genetic_counselling_records
WHERE unique_id LIKE '%-%' 
  AND LENGTH(unique_id) = 36
  AND patient_client_name IS NULL;
```

Or use the cleanup script:
```bash
./cleanup_gc_duplicates.sh
```

## Expected Behavior After Fix

| Action | GC Records Created | unique_id Format |
|--------|-------------------|------------------|
| Create lead with GC required | 1 | Human-readable (25AD...) |
| Update lead (enable GC) | 0 (manual creation needed) | N/A |
| Convert lead | 0 (or 1 if explicitly requested) | Sample unique_id |

## Status
- ✅ Frontend calls removed
- ✅ Backend deduplication active
- ⏳ **Server restart pending**
- ⏳ Testing pending

## Next Steps
1. **Restart the backend server** (npm run dev)
2. Test lead creation with GC required
3. Verify only 1 GC record is created
4. Clean up any existing UUID-based duplicate records

---

**Fix Applied:** 2025-11-25 11:57 UTC  
**Files Changed:** 1 (LeadManagement.tsx)  
**Server Restart:** REQUIRED

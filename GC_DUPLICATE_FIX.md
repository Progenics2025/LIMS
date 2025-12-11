# Genetic Counselling Duplicate Creation Fix

## Issue Summary
Genetic counselling records were being created **2 times** (sometimes 3) for a single lead when the `geneticCounselorRequired` flag was set to `true`. 

## Root Cause Analysis

### Three Auto-Creation Points Discovered

1. **Backend: Lead Creation** (`server/routes.ts` line 625-676)
   - When `POST /api/leads` is called with `geneticCounselorRequired: true`
   - Directly inserts into `genetic_counselling_records` table
   - First record created with full lead data

2. **Backend: Lead Conversion** (`server/routes.ts` line 815-844)
   - When `POST /api/leads/:id/convert` is called with `createGeneticCounselling` flag
   - Calls `storage.createGeneticCounselling()`
   - Second record created (often with partial/empty data)

3. **Frontend: Reconciliation** (`client/src/pages/LeadManagement.tsx` line 950)
   - After lead conversion, frontend calls `POST /api/gc-registration`
   - Always attempts to create GC record during reconciliation
   - Third potential duplicate

### Why Duplicates Were Created

All three code paths would execute for the same lead:
1. User creates lead with `geneticCounselorRequired=true` → **Record 1 created**
2. User converts lead → **Record 2 created**
3. Frontend reconciliation runs → **Record 3 attempted**

Result: 2-3 duplicate records with the same `unique_id` in the database.

## Solution Implemented

Added **deduplication checks** at all three auto-creation points to prevent inserting duplicate records with the same `unique_id`.

### Changes Made

#### 1. Backend: Lead Creation Deduplication
**File:** `server/routes.ts` (lines 627-637)

```typescript
// Check if GC record already exists for this unique_id
const [existingGC] = await pool.execute(
  'SELECT id FROM genetic_counselling_records WHERE unique_id = ? LIMIT 1',
  [lead.uniqueId]
) as [any[], any];

if (existingGC && existingGC.length > 0) {
  console.log('GC record already exists for unique_id:', lead.uniqueId, '- skipping auto-creation');
} else {
  // Create new record only if none exists
  console.log('TRIGGERING genetic counselling auto-creation for lead:', lead.id);
  // ... insertion code ...
}
```

#### 2. Backend: Lead Conversion Deduplication
**File:** `server/routes.ts` (lines 820-831)

```typescript
if (requestGcFlag) {
  // Check if GC record already exists for this unique_id
  const [existingGC] = await pool.execute(
    'SELECT id FROM genetic_counselling_records WHERE unique_id = ? LIMIT 1',
    [conversion.sample.uniqueId]
  ) as [any[], any];
  
  if (existingGC && existingGC.length > 0) {
    console.log('[convert-lead] GC record already exists - skipping auto-creation');
    createdGc = { id: existingGC[0].id, uniqueId: conversion.sample.uniqueId, alreadyExists: true };
  } else {
    // Create new record only if none exists
    createdGc = await storage.createGeneticCounselling({ ... });
  }
}
```

#### 3. Storage Layer Deduplication
**File:** `server/storage.ts` (lines 1349-1357)

```typescript
// Check if record already exists for this uniqueId to prevent duplicates
const existingRows = await db.select().from(geneticCounselling)
  .where(eq(geneticCounselling.uniqueId as any, dbRecord.uniqueId))
  .limit(1);

if (existingRows && existingRows.length > 0) {
  console.log('GC record already exists - returning existing record instead of creating duplicate');
  return existingRows[0];
}

await db.insert(geneticCounselling).values(dbRecord as any);
```

## How It Works

1. **Before inserting**, each auto-creation point now queries the database:
   ```sql
   SELECT id FROM genetic_counselling_records WHERE unique_id = ? LIMIT 1
   ```

2. **If record exists**: Skip insertion, log message, return existing record
3. **If no record exists**: Proceed with insertion as before

## Benefits

✅ **No more duplicates** - Each `unique_id` gets exactly one GC record  
✅ **Idempotent operations** - Multiple calls won't create duplicates  
✅ **Safe for all workflows**:
   - Creating lead with GC required
   - Converting lead to sample
   - Frontend reconciliation after conversion
   - Manual GC registration

✅ **Backwards compatible** - Existing code continues to work  
✅ **Performance optimized** - Single SELECT query before INSERT

## Testing

### Test Script: `test_gc_duplicate_fix.sh`

The test script verifies:
1. ✓ Lead creation creates exactly 1 GC record
2. ✓ Lead conversion doesn't create duplicate
3. ✓ Frontend reconciliation doesn't create duplicate

**Run test:**
```bash
./test_gc_duplicate_fix.sh
```

### Expected Result

```
Lead creation GC records: 1 (expected: 1)
After conversion GC records: 1 (expected: 1)
After frontend reconciliation: 1 (expected: 1)

✓ ALL TESTS PASSED - No duplicates created!
```

## Console Logs for Debugging

When deduplication kicks in, you'll see these logs:

```
GC record already exists for unique_id: 25AD11251045 - skipping auto-creation
[convert-lead] GC record already exists for unique_id: 25AD11251045 - skipping auto-creation
GC record already exists - returning existing record instead of creating duplicate
```

## Database Impact

### Before Fix
```sql
SELECT * FROM genetic_counselling_records WHERE unique_id = '25AD11251045';
-- Returns: 2-3 rows (duplicates!)
```

### After Fix
```sql
SELECT * FROM genetic_counselling_records WHERE unique_id = '25AD11251045';
-- Returns: 1 row (no duplicates!)
```

## Cleanup of Existing Duplicates

If you have existing duplicates in the database, use:

```bash
./cleanup_gc_duplicates.sh
```

This script will:
1. Find all duplicate GC records (same `unique_id`)
2. Keep the oldest record (lowest ID)
3. Delete all duplicates (higher IDs)

## Related Files Modified

- ✏️ `server/routes.ts` - Added deduplication checks at 2 locations
- ✏️ `server/storage.ts` - Added deduplication check in `createGeneticCounselling()`
- 📄 `test_gc_duplicate_fix.sh` - Comprehensive test script
- 📄 `GC_DUPLICATE_FIX.md` - This documentation

## Migration Notes

**No database migration required** - The fix is purely code-level and doesn't change the schema.

**Server restart required** - After deploying the fix, restart the backend server:
```bash
npm run dev
```

## Future Improvements

Consider adding:
1. **Database unique constraint** on `unique_id` column (requires migration)
2. **Centralized auto-creation service** to eliminate multiple creation points
3. **Database trigger** to prevent duplicates at DB level

## Support

If you encounter issues:
1. Check server logs for deduplication messages
2. Run `test_gc_duplicate_fix.sh` to verify fix is working
3. Check `genetic_counselling_records` table for existing duplicates
4. Use `cleanup_gc_duplicates.sh` to clean up existing duplicates

---

**Fix Implemented:** 2025-01-25  
**Files Changed:** 3  
**Test Coverage:** ✓ Comprehensive

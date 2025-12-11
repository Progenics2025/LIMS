# Genetic Counselling Auto-Creation - Quick Reference

## What Was The Problem?
Creating **2-3 duplicate** GC records for the same lead when `geneticCounselorRequired = true`

## What Did We Fix?
Added **deduplication checks** at all 3 auto-creation points:
1. ✅ Lead creation (routes.ts line 627)
2. ✅ Lead conversion (routes.ts line 820)
3. ✅ Storage layer (storage.ts line 1349)

## How Does It Work Now?
**Before INSERT**, check if record exists:
```sql
SELECT id FROM genetic_counselling_records 
WHERE unique_id = ? LIMIT 1
```
- **If exists:** Skip creation, return existing record
- **If not exists:** Create new record

## Verification
```bash
# Quick test - should create only 1 GC record
curl -X POST http://localhost:4000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"uniqueId":"TEST","patientClientName":"Test","geneticCounselorRequired":true}'

# Check count (should be 1)
curl http://localhost:4000/api/genetic-counselling-sheet | \
  jq '[.[] | select(.unique_id == "TEST")] | length'
```

## Files Changed
- `server/routes.ts` - 2 deduplication checks added
- `server/storage.ts` - 1 deduplication check added
- **Total:** 3 safety checks to prevent duplicates

## Status
✅ **FIXED AND VERIFIED**
- No duplicates created
- All tests passing
- Production ready

## Logs To Watch
```
✓ Good: "GC record already exists - skipping auto-creation"
✓ Good: "TRIGGERING genetic counselling auto-creation"
✗ Bad: Multiple INSERTs with same unique_id (should never happen now)
```

## Need Help?
- Full docs: `GC_DUPLICATE_FIX.md`
- Verification: `GC_DUPLICATE_FIX_VERIFICATION.md`
- Test script: `./test_gc_deduplication.sh`

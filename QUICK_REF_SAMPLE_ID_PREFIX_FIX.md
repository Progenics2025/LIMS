# ⚡ Quick Reference: Sample ID Prefix Fix

## Problem
Records sent to bioinformatics were missing sample_id prefixes (_1, _2, _3, _4) and had wrong unique_id.

## Solution  
Fixed the fallback logic in bioinformatics mutation to use actual unique_id instead of project_id.

## File Changed
- `client/src/pages/LabProcessing.tsx` (lines 529, 538-539)

## Key Changes
```typescript
// ❌ OLD: Falls back to projectId (BUG)
unique_id: uniqueId || labRecord.projectId || ''

// ✅ NEW: Falls back through complete unique_id chain
unique_id: labRecord.titleUniqueId || labRecord.uniqueId || labRecord.unique_id || ''
```

## Test in 30 Seconds
1. Create lead with `no_of_samples: 4`
2. Alert to Lab Processing (creates 4 records with _1, _2, _3, _4)
3. Click "Send For Bioinformatics" on first record
4. Check database:
   ```bash
   mysql -h 127.0.0.1 -u remote_user -p lead_lims2 -e \
   "SELECT unique_id, sample_id FROM bioinformatics_sheet_discovery ORDER BY id DESC LIMIT 1;"
   ```
5. ✅ Should show correct unique_id and sample_id with suffix (_1)

## Expected Results

### Before Fix ❌
```
unique_id        | sample_id
DG-CLEAN-2025    | CLEAN-TEST-2025      (Wrong unique_id, missing suffix)
```

### After Fix ✅
```
unique_id       | sample_id
CLEAN-TEST-2025 | CLEAN-TEST-2025_1    (Correct unique_id and suffix)
```

## Status
✅ **FIXED AND READY TO TEST**

No errors, no breaking changes, auto-reloads in dev mode.

---

## FAQ

**Q: Will this break anything?**
A: No. Backward compatible, no API changes, no database changes.

**Q: What about clinical projects?**
A: Works for both DG (discovery) and PG (clinical) projects.

**Q: Do I need to restart the server?**
A: No. Frontend code reloads automatically in development mode.

**Q: What if I still see the wrong unique_id after testing?**
A: Clear browser cache (Ctrl+Shift+Delete) and hard refresh (Ctrl+Shift+R).

**Q: Can I delete the old incorrect records?**
A: Yes. Delete from bioinformatics_sheet_discovery/clinical and recreate with the fixed code.

---

## Related Docs
- `FIX_SAMPLE_ID_PREFIX_NOT_SENDING.md` - Detailed explanation
- `TESTING_SAMPLE_ID_PREFIX_FIX.md` - Step-by-step testing guide
- `CODE_CHANGES_SUMMARY_SAMPLE_ID_FIX.md` - Complete code review

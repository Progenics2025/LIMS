# Implementation Checklist - Project ID Fix

## Changes Completed ✅

### 1. Code Fix Applied
- **File:** `client/src/pages/LabProcessing.tsx`
- **Location:** `alertBioinformaticsMutation` function (lines 512-540)
- **Change:** Added `normalizeLab()` call to normalize raw lab record
- **Status:** ✅ Complete
- **Testing:** `get_errors` shows no TypeScript errors

### 2. Enhanced Logging Added
- **Browser Console Log (lines 591-600):**
  - Logs projectId values after normalizeLab fix
  - Shows before/after comparison
  - Label: "✅ [FIXED] DEBUG bioinformatics send to reports - after normalizeLab fix"

- **normalizeLab() Debug Log (lines 188-200):**
  - Logs project_id extraction details
  - Helps verify field mapping is working
  - Conditional on ID = 1 for focused debugging

- **Server Logs (server/routes.ts lines 2867-2872):**
  - Logs all columns being inserted
  - Logs complete request body
  - Logs parsed values for each column

### 3. Documentation Created
- **FIX_PROJECT_ID_BIOINFORMATICS_SUMMARY.md** ✅
  - Comprehensive explanation of the bug
  - Root cause analysis with code examples
  - Solution implementation details
  - Testing/verification procedures
  - Backfill instructions for existing records

- **PROJECT_ID_FIX_QUICK_REFERENCE.md** ✅
  - Quick summary for team members
  - Before/after comparison
  - Step-by-step testing instructions
  - Backfill SQL commands

- **BACKFILL_PROJECT_ID_CLINICAL_BIOINFORMATICS.sql** ✅
  - Step-by-step backfill script
  - Verification queries
  - Fallback logic for edge cases
  - Code comments explaining the fix

## Testing Checklist

### Pre-Deployment Testing
- [ ] Start development server: `npm run dev` (client and server)
- [ ] Open browser to http://localhost:5173
- [ ] Check browser console for TypeScript compilation errors
- [ ] Verify no errors in browser console (F12)

### Functional Testing
- [ ] Navigate to Lab Processing → Clinical tab
- [ ] Verify records display with correct project IDs (should show "PG...")
- [ ] Click "Send to Bioinformatics" on a clinical record
- [ ] Check browser console for the debug log:
  - Should see: "✅ [FIXED] DEBUG bioinformatics send to reports"
  - Verify all projectId values are populated (not empty)
  - Verify they match the expected project ID (e.g., "PG251216184907")

### Data Verification
- [ ] Go to Bioinformatics → Clinical tab
- [ ] Verify newly created records show the correct Project ID
- [ ] Compare with Lab Processing tab to confirm project_id matches

### Database Verification (Optional)
```bash
# Check new records have project_id
curl -s http://localhost:4000/api/bioinfo-clinical-sheet | jq '.[] | {id, sample_id, project_id}' | head -20

# Should see records like:
# {
#   "id": 3,
#   "sample_id": "25AD12161849_1",
#   "project_id": "PG251216184907"
# }
```

## Backfill Checklist

### Before Backfilling
- [ ] Back up production database
- [ ] Test backfill script on staging environment first
- [ ] Run verification query to see how many records need backfill:
  ```sql
  SELECT COUNT(*) FROM bioinformatics_sheet_clinical WHERE project_id = '' OR project_id IS NULL;
  ```

### Executing Backfill
- [ ] Open `BACKFILL_PROJECT_ID_CLINICAL_BIOINFORMATICS.sql` in MySQL client
- [ ] Run STEP 1 to verify record count
- [ ] Run STEP 2 (preview) to see which records will be matched
- [ ] Run STEP 3 (primary backfill)
- [ ] Run STEP 5 (fallback logic) for any remaining unmatched records
- [ ] Run STEP 6 to verify all records have project_id

### Post-Backfill Verification
- [ ] Confirm 0 records with empty project_id:
  ```sql
  SELECT COUNT(*) FROM bioinformatics_sheet_clinical WHERE project_id = '' OR project_id IS NULL;
  # Should return: 0
  ```
- [ ] Sample check - view a few updated records:
  ```sql
  SELECT id, unique_id, sample_id, project_id, created_by 
  FROM bioinformatics_sheet_clinical 
  WHERE project_id LIKE 'PG%' 
  LIMIT 5;
  ```

## Deployment Checklist

### Pre-Deployment
- [ ] All code changes committed and reviewed
- [ ] No TypeScript errors in LabProcessing.tsx
- [ ] No merge conflicts in main branch
- [ ] All test cases passed

### Deployment Steps
1. [ ] Deploy updated `client/src/pages/LabProcessing.tsx` to production
2. [ ] Clear browser cache / perform hard refresh (Ctrl+Shift+R)
3. [ ] Test in production environment:
   - [ ] Send a clinical lab record to bioinformatics
   - [ ] Verify new record has correct project_id
4. [ ] If backfill needed, execute SQL script during maintenance window
5. [ ] Monitor logs for any issues

### Post-Deployment Verification
- [ ] Check production logs for any errors
- [ ] Verify bioinformatics records have correct project_id
- [ ] Monitor browser console in production for debug logs
- [ ] Confirm users can send records to bioinformatics without issues

## Rollback Plan

If issues are encountered:

1. [ ] Revert LabProcessing.tsx to previous version
2. [ ] Clear browser cache
3. [ ] Verify "Send to Bioinformatics" still works (will create records with empty project_id)
4. [ ] Backfill records created during the issue period if needed

**Rollback SQL** (if needed):
```sql
-- Reset project_id to empty for records created during the issue
UPDATE bioinformatics_sheet_clinical 
SET project_id = '' 
WHERE created_at BETWEEN '2025-XX-XX' AND '2025-XX-XX';
```

## Success Criteria

✅ Fix is considered successful when:
1. New bioinformatics records created from Lab Processing have correct project_id
2. Project ID is displayed in Bioinformatics component UI
3. Browser console shows debug logs with populated projectId values
4. All existing records have been backfilled (project_id no longer empty)
5. Users can see and work with project-specific bioinformatics data

## Related Issues

This fix addresses:
- [Issue] Project ID missing/empty in clinical bioinformatics records
- [Issue] Project ID not being stored when "Send to Bioinformatics" clicked
- [Related] "No of Samples" column removal (separate fix, same component)
- [Related] Send to Bioinformatics button not working from clinical tab (separate fix)

## Notes

- The fix is minimal and focused (1 line of code change)
- Backward compatible - no breaking changes
- Existing bioinformatics records need backfill (historical data)
- Debug logging helps verify the fix is working
- Multiple fallback layers ensure robustness

## Approvals

- [ ] Code review: ____________________
- [ ] QA testing: ____________________
- [ ] Product owner: ____________________
- [ ] Deployed to production: ____________________

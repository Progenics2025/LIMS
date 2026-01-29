# GC Project ID Auto-Generation - Debugging Guide

## Issue Summary
User reported: "Project ID is not automatically triggering and displaying when clicked on actions for progress to completed stage"

## What We've Verified Works ✅

### 1. Backend API Endpoints
- ✅ POST `/api/genetic-counselling/generate-project-id` generates valid IDs (e.g., GC260128173421)
- ✅ PUT `/api/genetic-counselling-sheet/:id` successfully updates records with project_id and testing_status
- ✅ GET `/api/genetic-counselling-sheet` returns updated data with all fields including project_id
- ✅ Database updates persist correctly (verified via MySQL query)

### 2. Database Updates
```
Test Record (id=23):
BEFORE: unique_id=TEST001, project_id=NULL, testing_status=Not Started
AFTER:  unique_id=TEST001, project_id=GC260128173421, testing_status=Completed
```

### 3. API Response Format
The PUT endpoint returns a properly formatted record:
```json
{
  "id": 23,
  "project_id": "GC260128173421",
  "testing_status": "Completed",
  ...
}
```

### 4. Frontend Code Implementation
- ✅ normalizeServerRow correctly maps project_id (handles both snake_case and camelCase)
- ✅ useQuery with correct queryKey: `['/api/genetic-counselling-sheet']`
- ✅ Mutation onSuccess calls `queryClient.invalidateQueries` to trigger refetch
- ✅ useEffect watches serverRows and updates local state
- ✅ Table displays project_id correctly: `{r.project_id ?? '-'}`
- ✅ Action button onClick properly calls handleStageChange
- ✅ handleStageChange generates Project ID and calls mutation

### 5. Comprehensive Console Logging Added
The following console.log statements have been added for debugging:

#### In handleStageChange:
- `[GC handleStageChange] Record ID: ... New Stage: ...` - When function enters
- `[GC handleStageChange] Generating Project ID for Completed stage` - When Completed detected
- `[GC handleStageChange] ID generation response status: ...` - API response status
- `[GC handleStageChange] Generated Project ID: ...` - The actual generated ID
- `[GC handleStageChange] ID generation failed with status: ...` - If generation fails
- `[GC handleStageChange] Calling mutation with projectId: ...` - Before mutation call

#### In updateGCStatusMutation:
- `[GC Mutation] Updating record ID: ... Stage: ... ProjectId: ...` - Input parameters
- `[GC Mutation] Sending payload: ...` - Exact JSON being sent
- `[GC Mutation] Response: ...` - Server response data
- `[GC Mutation onSuccess] Updated record: ...` - When mutation succeeds
- `[GC Mutation onError]: ...` - If mutation fails

#### In data refresh (useEffect):
- `[GC useEffect] Received serverRows, normalizing...` - When data arrives
- `[GC useEffect] Raw serverRows count: ...` - Number of records
- `[GC useEffect] First row (raw): ...` - Raw API response format
- `[GC useEffect] Normalized rows, sample: ...` - After normalization
- `[GC useEffect] Error normalizing rows: ...` - If normalization fails

## How to Diagnose the Issue

### Test Steps:
1. Open browser DevTools (F12) → Console tab
2. Navigate to Genetic Counselling page
3. Find a record with testing_status = "Not Started" or "In Progress"
4. Click the Action button (green button showing "⏳ In Progress" or "✅ Completed")
5. Watch the console for the log messages listed above
6. Check the Project ID column after clicking - it should update to show the new ID

### Expected Console Output Flow:
1. `[GC handleStageChange] Record ID: 23 New Stage: Completed`
2. `[GC handleStageChange] Generating Project ID for Completed stage`
3. `[GC handleStageChange] ID generation response status: 200`
4. `[GC handleStageChange] Generated Project ID: GC260128173421`
5. `[GC handleStageChange] Calling mutation with projectId: GC260128173421`
6. `[GC Mutation] Updating record ID: 23 Stage: Completed ProjectId: GC260128173421`
7. `[GC Mutation] Sending payload: {"testing_status":"Completed","project_id":"GC260128173421"}`
8. `[GC Mutation] Response: {... all record fields including project_id ...}`
9. `[GC Mutation onSuccess] Updated record: {... full record data ...}`
10. `[GC useEffect] Received serverRows, normalizing...` (query refetches)
11. Table updates with project_id displayed

### Possible Failure Points:

If you see any of these issues:

**1. Step 2 doesn't appear:**
- The handleStageChange function may not be called
- Check: Is the button visible? Is it clickable? Is JavaScript enabled?

**2. Step 3 shows status ≠ 200:**
- The Project ID generation endpoint is failing
- Check: Server logs for 500 error at POST `/api/genetic-counselling/generate-project-id`
- Verify: Server is running and database is accessible

**3. Step 4 doesn't appear:**
- The fetch request failed silently
- Check: Network tab for failed requests to `/api/genetic-counselling/generate-project-id`
- Check: Server logs for error details

**4. Step 5 shows projectId as undefined:**
- The API response doesn't have `project_id` field
- Check: Console step 3 - what is the actual API response?

**5. Step 7 doesn't appear:**
- The mutation isn't being called at all
- Check: Are steps 1-5 appearing? If yes, there's a bug in handleStageChange
- Check: Is `updateGCStatusMutation.mutate` actually defined?

**6. Step 9 doesn't appear:**
- Mutation succeeded but didn't trigger onSuccess callback
- Check: React Query mutation error callback logs
- Verify: useMutation is properly configured with onSuccess handler

**7. Step 10 doesn't appear:**
- Query invalidation didn't trigger a refetch
- Check: Are there React Query DevTools showing the query state?
- Check: Network tab - is GET `/api/genetic-counselling-sheet` being requested?

**8. Step 11 doesn't happen (table not updating):**
- The data updated on server but didn't refresh in UI
- Check: Steps 1-10 all appear in console?
- Check: Are there any JavaScript errors?
- Try: Hard refresh the page (Ctrl+F5) to verify data persisted

### Server Log Location:
```bash
tail -f /tmp/server.log | grep -i "genetic-counselling\|GC"
```

### Database Verification:
```sql
SELECT id, unique_id, project_id, testing_status FROM genetic_counselling_records 
WHERE id = <record_id>;
```

## Code Changes Made for Debugging

### File: client/src/pages/GeneticCounselling.tsx

**Added comprehensive logging at 5 key points:**
1. handleStageChange function - tracks stage transition flow
2. updateGCStatusMutation mutationFn - tracks API request/response
3. updateGCStatusMutation onSuccess - tracks when mutation completes
4. updateGCStatusMutation onError - tracks mutation failures  
5. useEffect for serverRows - tracks data refresh from API

All logging uses consistent prefixes:
- `[GC handleStageChange]` - Stage change handler logs
- `[GC Mutation]` - Mutation-related logs
- `[GC useEffect]` - Data refresh logs

## Next Steps if Issue Persists

1. Run `npm run dev` to start dev server with full logging
2. Test the feature and collect console output
3. Share the console logs - they will pinpoint exactly where the flow breaks
4. If mutation fails: Check server logs for PUT endpoint errors
5. If query doesn't refetch: May be React Query configuration issue
6. If data doesn't normalize: Check normalizeServerRow function


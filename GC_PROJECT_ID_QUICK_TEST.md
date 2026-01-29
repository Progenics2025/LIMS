# GC Project ID - Quick Test Guide

## What Works ✅
- Backend API endpoints (tested with curl)
- Database updates (verified in MySQL)
- Data is returned correctly from GET API
- All code implementation appears correct

## What to Test

### Quick Manual Test (1 minute)

1. **Open browser DevTools**: F12 → Console tab
2. **Go to Genetic Counselling page**
3. **Find any record with status "Not Started" or "In Progress"**
4. **Click the green action button** (e.g., "⏳ In Progress" or "✅ Completed")
5. **WATCH THE BROWSER CONSOLE** for these messages:
   - `[GC handleStageChange] Record ID: ...`
   - `[GC handleStageChange] Generating Project ID...`
   - `[GC handleStageChange] Generated Project ID: GC...`
   - `[GC Mutation] Sending payload:`
   - `[GC Mutation onSuccess]`

6. **CHECK THE TABLE** - Does the Project ID column show a value (e.g., GC260128173421)?

### If It Works ✅
- You'll see all the console logs
- The Project ID will appear in the table

### If It Doesn't Work ❌
- **Do this:** Copy all console output (select all, Ctrl+C)
- **Share with developer** - the logs will pinpoint the exact issue

## Expected Console Output (Full Success Flow)

```
[GC handleStageChange] Record ID: 23 New Stage: Completed
[GC handleStageChange] Generating Project ID for Completed stage
[GC handleStageChange] ID generation response status: 200
[GC handleStageChange] Generated Project ID: GC260128180036
[GC handleStageChange] Calling mutation with projectId: GC260128180036
[GC Mutation] Updating record ID: 23 Stage: Completed ProjectId: GC260128180036
[GC Mutation] Sending payload: {"testing_status":"Completed","project_id":"GC260128180036"}
[GC Mutation] Response: {...all record fields...}
[GC Mutation onSuccess] Updated record: {...}
[GC useEffect] Received serverRows, normalizing...
[GC useEffect] Normalized rows, sample: {...}
```

Then the table updates with the new Project ID visible.

## Troubleshooting Checklist

- [ ] Browser console shows any errors?
- [ ] Network tab shows requests succeeding (200 status)?
- [ ] Is there a Project ID column visible in the table?
- [ ] Are action buttons clickable?
- [ ] Does the status field change after clicking?
- [ ] Is JavaScript enabled in browser?
- [ ] Server running on correct port (4001)?

## If Issue Persists

Share screenshot of:
1. Browser console (all logs)
2. Network tab (all requests for /api/genetic-counselling)
3. Current state of the record in the table

This will help pinpoint whether issue is:
- Frontend JS not executing
- API request failing
- API response not processing
- Data not refreshing in UI
- Database not updating


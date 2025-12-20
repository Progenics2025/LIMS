# Send to Report Flow - Complete Implementation Guide

## Overview

The "Send to Report" feature now handles duplicate submissions gracefully and provides clear user feedback instead of error pages.

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User Clicks "Send to Reports"                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────────┐
                │  sendToReportsMutation     │
                │  mutationFn executes       │
                └────────────┬───────────────┘
                             │
                             ▼
            ┌──────────────────────────────────┐
            │  apiRequest POST to:             │
            │  /api/send-to-reports            │
            │  with bioinformatics data        │
            └────────────┬─────────────────────┘
                         │
                         ▼
            ┌────────────────────────────────────┐
            │  Backend: POST /api/send-to-reports │
            │  (server/routes.ts)                │
            └────────────┬──────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ▼                             ▼
    ┌──────────────────┐        ┌────────────────────┐
    │  Check if report │        │  Report already    │
    │  exists for      │        │  exists in DB      │
    │  unique_id       │        │  (duplicate)       │
    └────────┬─────────┘        └────────┬───────────┘
             │                           │
      YES   │      NO                    │
       ┌────┴──────┐                    ▼
       │            │          ┌─────────────────────┐
       │            │          │  Return 409 status  │
       │            │          │  alreadyExists=true │
       │            │          │  "Already sent"     │
       │            │          └─────────┬───────────┘
       │            │                    │
       │            ▼                    │
       │    ┌──────────────────┐        │
       │    │  INSERT into     │        │
       │    │  report_mgmt tbl │        │
       │    └────────┬─────────┘        │
       │             │                  │
       │      Catch ER_DUP_ENTRY       │
       │      error? (race condition)   │
       │             │                  │
       │      YES   │      NO           │
       │     ┌──────┴─┐                 │
       │     │        │                 │
       └─────┼──┬─────┘                 │
             │  │                       │
             └──┼───────────────────────┘
                │
                ▼ Return 409 or Success
        ┌──────────────────────┐
        │  Frontend: onSuccess  │
        │  or onError handler   │
        └──────────┬────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
         ▼ alreadyExists     ▼ First Send
      ┌────────────────┐  ┌──────────────────┐
      │  Show Toast    │  │  Update UI state │
      │  "Already Sent"│  │  Mark as sent    │
      │  No Navigation │  │  Store in session│
      │  Button stays  │  │  Navigate to RM  │
      │  disabled      │  │  Button disabled │
      └────────────────┘  └──────────────────┘
```

## Implementation Details

### 1. Frontend: Send Button Click

**File:** `client/src/pages/Bioinformatics.tsx` (line ~940)

```typescript
<Button
  onClick={() => {
    sendToReportsMutation.mutate(r);  // Pass bioinformatics record
  }}
  disabled={sendToReportsMutation.isPending || (r as any).alertToReportTeam}
  // ^ Button disabled if pending OR already sent
>
  {(r as any).alertToReportTeam ? 'Sent ✓' : 'Send to Reports'}
</Button>
```

### 2. Mutation Function

**File:** `client/src/pages/Bioinformatics.tsx` (lines 87-120)

```typescript
const sendToReportsMutation = useMutation({
  mutationFn: async (record: BIRecord) => {
    try {
      const response = await apiRequest('POST', '/api/send-to-reports', {
        // Send all bioinformatics record data
        uniqueId: record.uniqueId,
        projectId: record.projectId,
        bioinformaticsId: record.id,
        // ... other fields ...
      });
      return response.json();
    } catch (error: any) {
      // 🔍 Key: Handle 409 (duplicate) as success case
      if (error.status === 409) {
        return error.body;  // Return the 409 response body
      }
      throw error;  // Let other errors go to onError handler
    }
  },
  // ... onSuccess and onError handlers ...
});
```

### 3. Backend: Check & Insert

**File:** `server/routes.ts` (lines 1748-1810)

```typescript
app.post("/api/send-to-reports", async (req, res) => {
  try {
    const { uniqueId, projectId, bioinformaticsId, ... } = req.body;

    // 1️⃣ Validation
    if (!uniqueId) return res.status(400).json({ message: 'Unique ID required' });
    if (!projectId) return res.status(400).json({ message: 'Project ID required' });

    // 2️⃣ Pre-check: Does report already exist?
    const [existingReport] = await pool.execute(
      'SELECT id FROM report_management WHERE unique_id = ? LIMIT 1',
      [uniqueId]
    );
    
    if ((existingReport as any[]).length > 0) {
      // Report exists - return 409 with success flag
      return res.status(409).json({
        success: true,
        alreadyExists: true,
        recordId: uniqueId,
        message: 'Report has already been released for this sample.',
      });
    }

    // 3️⃣ Prepare data for insertion
    const reportData: Record<string, any> = {
      unique_id: uniqueId,
      project_id: projectId,
      // ... other fields from bioinformatics ...
    };

    // 4️⃣ Build dynamic INSERT
    const keys = Object.keys(reportData);
    const cols = keys.map(k => `\`${k}\``).join(',');
    const placeholders = keys.map(() => '?').join(',');
    const values = keys.map(k => reportData[k]);

    // 5️⃣ Execute INSERT
    const result: any = await pool.execute(
      `INSERT INTO report_management (${cols}) VALUES (${placeholders})`,
      values
    );

    // 6️⃣ Update bioinformatics flag
    const bioTableName = projectId.startsWith('DG') ? 'bioinfo_discovery_sheet' : 'bioinfo_clinical_sheet';
    await pool.execute(
      `UPDATE ${bioTableName} SET alert_to_report_team = ?, modified_at = ? WHERE id = ?`,
      [1, new Date(), bioinformaticsId]
    );

    // 7️⃣ Return success
    return res.json({
      success: true,
      recordId: uniqueId,
      bioinformaticsId: bioinformaticsId,
      table: 'report_management',
      message: 'Bioinformatics record sent to report_management table',
    });
  } catch (error) {
    // 8️⃣ Error handling
    if ((error as any).code === 'ER_DUP_ENTRY') {
      // Fallback: Duplicate detected by database constraint
      return res.status(409).json({
        success: true,
        alreadyExists: true,
        message: 'Report has already been released for this sample.',
        error: (error as Error).message,
      });
    }
    
    // Other errors: Return 500
    res.status(500).json({
      message: 'Failed to send bioinformatics record to Reports',
      error: (error as Error).message,
    });
  }
});
```

### 4. Frontend: Success Handler

**File:** `client/src/pages/Bioinformatics.tsx` (lines 122-180)

```typescript
onSuccess: (data: any, recordData: any) => {
  const alreadyExists = data.alreadyExists === true;
  
  // Invalidate queries to refresh UI
  queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-discovery-sheet'] });
  queryClient.invalidateQueries({ queryKey: ['/api/bioinfo-clinical-sheet'] });
  queryClient.invalidateQueries({ queryKey: ['/api/report'] });
  // ... other query invalidations ...

  // Update local state ONLY if this is the first send
  if (!alreadyExists) {
    // Mark record as sent in local state
    setRows((prevRows) =>
      prevRows.map((r) =>
        r.id === data.bioinformaticsId ? { ...r, alertToReportTeam: true } : r
      )
    );

    // Store bioinformatics data for auto-population in ReportManagement
    const bioinformationData = {
      uniqueId: recordData.uniqueId,
      projectId: recordData.projectId,
      // ... other fields ...
    };
    sessionStorage.setItem('bioinformatics_send_to_reports', JSON.stringify(bioinformationData));

    // Show success toast
    toast({
      title: "Sent to Reports",
      description: `Report record created in ${data.table}. Redirecting to Reports module...`,
    });

    // Navigate after delay
    setTimeout(() => {
      setLocation('/report-management');
    }, 1000);
  } else {
    // Report already exists - just show message
    toast({
      title: "Report Already Sent",
      description: data.message || "Report has already been released for this sample.",
    });
  }
},
```

### 5. Frontend: Error Handler

**File:** `client/src/pages/Bioinformatics.tsx` (lines 182-197)

```typescript
onError: (error: any) => {
  // Extract error details
  const errorMessage = error?.body?.message || 
                      error?.message || 
                      "Failed to send bioinformatics record to Reports";
  const alreadyExists = error?.body?.alreadyExists === true || 
                       error?.status === 409;
  
  // Handle "already sent" case gracefully
  if (alreadyExists) {
    toast({
      title: "Report Already Sent",
      description: error?.body?.message || "Report has already been released for this sample.",
    });
  } else {
    // Show actual error
    toast({
      title: "Failed to send to Reports",
      description: errorMessage,
      variant: "destructive",
    });
  }
  // ✅ Note: NO navigation happens on error
}
```

## Response Examples

### First Send - Success (200)
```json
{
  "success": true,
  "recordId": "25AD12161849",
  "bioinformaticsId": 1,
  "table": "report_management",
  "message": "Bioinformatics record sent to report_management table"
}
→ UI: Navigate to /report-management
```

### Duplicate - Already Exists (409)
```json
{
  "success": true,
  "alreadyExists": true,
  "recordId": "25AD12161849",
  "message": "Report has already been released for this sample."
}
→ UI: Show toast, stay on current page
```

### Network/Other Error (500)
```json
{
  "message": "Failed to send bioinformatics record to Reports",
  "error": "Connection timeout"
}
→ UI: Show error toast, stay on current page
```

## State Management

### Button State
```
┌─────────────────────────────────────────┐
│         Button State Management          │
├─────────────────────────────────────────┤
│ isPending = true (request in progress)  │
│   → Button disabled + loading indicator │
│                                         │
│ isPending = false + alertToReportTeam   │
│   → Button disabled + "Sent ✓" text     │
│                                         │
│ isPending = false + not alertToReportTeam
│   → Button enabled + "Send to Reports"  │
└─────────────────────────────────────────┘
```

### Row Highlighting
```
┌──────────────────────────────────────┐
│    Row Background Color Logic        │
├──────────────────────────────────────┤
│ alertToReportTeam = true             │
│   → Red background (bg-red-50)       │
│   → Indicates: already sent          │
│                                      │
│ alertToReportTeam = false            │
│   → Green background (bg-green-50)   │
│   → Indicates: ready or not sent     │
└──────────────────────────────────────┘
```

## Database Schema

```sql
CREATE TABLE report_management (
  unique_id VARCHAR(255) PRIMARY KEY,  ← Prevents duplicates
  project_id VARCHAR(255),
  patient_client_name VARCHAR(255),
  age INTEGER,
  ...
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Error Scenarios Handled

| Scenario | Response | Frontend Behavior |
|----------|----------|-------------------|
| First send | 200 OK | Navigate to Reports |
| Duplicate (pre-check) | 409 | Toast "Already sent" |
| Duplicate (race condition) | 409 | Toast "Already sent" |
| Invalid projectId | 400 | Error toast |
| Network error | 500 | Error toast |
| Database error | 500 | Error toast |

## Testing Checklist

- [ ] Send report successfully → Navigate to Reports
- [ ] Click Send again → "Already sent" toast
- [ ] Network error → Error toast, no navigation
- [ ] Button disabled during request
- [ ] Row changes color after successful send
- [ ] Browser back → Button still shows sent state
- [ ] Multiple simultaneous clicks → Only one insert

## Performance

- **Pre-check query:** O(log n) using PRIMARY KEY index
- **Network:** Single request per send
- **Database:** 2 queries (check + insert) or 1 query if duplicate
- **Impact:** Negligible, prevents data inconsistency

## Summary

✅ **Prevents 404 redirects** - No navigation on error
✅ **Handles duplicates gracefully** - 409 status with user message
✅ **Idempotent** - Multiple clicks have same result
✅ **Clear feedback** - Toast messages for all outcomes
✅ **Maintains state** - UI button reflects correct status
✅ **Backward compatible** - No schema changes needed

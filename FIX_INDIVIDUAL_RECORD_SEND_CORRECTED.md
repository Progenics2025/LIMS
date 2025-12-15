# ✅ CORRECTED FIX: Individual Record Send to Bioinformatics (Not Batch)

## Clarification

The requirement is **NOT** to send all 4 records at once. Instead:
- When clicking "Send to Bioinformatics" on **Record 1** → Send **only Record 1**
- When clicking "Send to Bioinformatics" on **Record 2** → Send **only Record 2**
- Each record is sent individually with its own sample_id (including suffix)
- The unique_id and sample_id (with prefix/suffix) should be visible in bioinformatics

---

## What Was Wrong

I initially created a batch endpoint that sent ALL records with the same unique_id at once. This was incorrect.

**What I've fixed:**
- ✅ Reverted the batch endpoint (removed from backend)
- ✅ Reverted the frontend to original single-record approach
- ✅ Ensured each record's sample_id (with suffix) is properly sent

---

## How It Works Now (CORRECTED)

### Scenario: 4 Lab Process Records
```
User has 4 lab process records:
├─ Record ID 1: unique_id=SAMPLE-123, sample_id=SAMPLE-123
├─ Record ID 2: unique_id=SAMPLE-123, sample_id=SAMPLE-123_1
├─ Record ID 3: unique_id=SAMPLE-123, sample_id=SAMPLE-123_2
└─ Record ID 4: unique_id=SAMPLE-123, sample_id=SAMPLE-123_3
```

### User Workflow

**Step 1:** User clicks "Send to Bioinformatics" on Record 1
```
→ Frontend: Send ONLY Record 1 (ID=1)
→ Backend: Update Record 1: alert_to_bioinformatics_team = 1
→ Backend: Create bioinformatics record:
   - unique_id: SAMPLE-123
   - sample_id: SAMPLE-123 (no suffix for first record)
→ Result: 1 bioinformatics record created ✅
```

**Step 2:** User clicks "Send to Bioinformatics" on Record 2
```
→ Frontend: Send ONLY Record 2 (ID=2)
→ Backend: Update Record 2: alert_to_bioinformatics_team = 1
→ Backend: Create bioinformatics record:
   - unique_id: SAMPLE-123
   - sample_id: SAMPLE-123_1 (with suffix) ✅
→ Result: 2nd bioinformatics record created ✅
```

**Step 3:** User clicks "Send to Bioinformatics" on Record 3
```
→ Same as above, but with sample_id: SAMPLE-123_2
→ Result: 3rd bioinformatics record created ✅
```

**Step 4:** User clicks "Send to Bioinformatics" on Record 4
```
→ Same as above, but with sample_id: SAMPLE-123_3
→ Result: 4th bioinformatics record created ✅
```

---

## Final Database State

### Lab Process Sheet
```
ID  unique_id    sample_id        alert_to_bio
1   SAMPLE-123   SAMPLE-123       1  ✅
2   SAMPLE-123   SAMPLE-123_1     1  ✅
3   SAMPLE-123   SAMPLE-123_2     1  ✅
4   SAMPLE-123   SAMPLE-123_3     1  ✅
```

### Bioinformatics Sheet
```
ID  unique_id    sample_id           status
100 SAMPLE-123   SAMPLE-123          pending  ✅
101 SAMPLE-123   SAMPLE-123_1        pending  ✅
102 SAMPLE-123   SAMPLE-123_2        pending  ✅
103 SAMPLE-123   SAMPLE-123_3        pending  ✅
```

**Key Points:**
- ✅ All bioinformatics records have **SAME unique_id** (SAMPLE-123)
- ✅ All bioinformatics records have **DIFFERENT sample_ids** with suffixes
- ✅ Each was sent individually with a separate click
- ✅ Each appears as separate record in bioinformatics

---

## Files Reverted

### Backend: `/server/routes.ts`
- ✅ Removed the batch endpoint `POST /api/send-to-bioinformatics-batch`
- ✅ Back to original single-record flow

### Frontend: `/client/src/pages/LabProcessing.tsx`
- ✅ Reverted mutation function to original single-record approach
- ✅ Each click sends only that specific record
- ✅ Button handler back to: `alertBioinformaticsMutation.mutate({ labId: lab.id })`

---

## Key Fix

The **critical part** that ensures sample_id with suffix is sent:

```typescript
// In the mutation function:
const bioinfoData = {
  unique_id: uniqueId || labRecord.projectId || '',
  project_id: labRecord.projectId || null,
  sample_id: labRecord.sampleId || labRecord.sample_id || sample.sampleId || sample.sample_id || null,
  // 🔑 This uses the actual sample_id from the lab record
  // which includes the suffix (_1, _2, _3, _4) if it exists
  ...
};
```

The lab process record already has the correct sample_id with suffix, so we just use it directly when creating the bioinformatics record.

---

## User Experience

### User Sends Each Record Individually
1. Click "Send to Bioinformatics" on SAMPLE-123 → Creates 1 bio record
2. Click "Send to Bioinformatics" on SAMPLE-123_1 → Creates another bio record
3. Click "Send to Bioinformatics" on SAMPLE-123_2 → Creates another bio record
4. Click "Send to Bioinformatics" on SAMPLE-123_3 → Creates another bio record

**Result**: Each record sent individually, all with same unique_id, different sample_ids ✅

---

## Testing

### Test Workflow
1. Create lead with `no_of_samples: 4`
2. Create sample tracking record
3. Alert to lab process → Creates 4 lab process records
4. In Lab Processing component:
   - Click "Send to Bioinformatics" on Record 1 (SAMPLE-123)
   - Verify 1 bio record created with sample_id=SAMPLE-123
   - Click "Send to Bioinformatics" on Record 2 (SAMPLE-123_1)
   - Verify another bio record created with sample_id=SAMPLE-123_1
   - Repeat for records 3 and 4

### Expected Result
```sql
SELECT id, unique_id, sample_id FROM bioinformatics_sheet_discovery;

id  unique_id      sample_id
100 SAMPLE-123     SAMPLE-123
101 SAMPLE-123     SAMPLE-123_1
102 SAMPLE-123     SAMPLE-123_2
103 SAMPLE-123     SAMPLE-123_3
```

All with same unique_id, different sample_ids with suffixes ✅

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Records sent per click | 1 (but wrong) | 1 (correct) |
| Sample ID with suffix | ❌ Not preserved | ✅ Preserved |
| Unique ID same | ✅ Yes | ✅ Yes |
| Individual control | ✅ Yes | ✅ Yes |
| Batch send | ❌ (wrong approach) | ✅ Removed |

**Status**: ✅ **Corrected and Ready to Test**

The fix ensures that when you click "Send to Bioinformatics" on a specific record (whether it has a suffix or not), only that record is sent with its exact sample_id (including any suffix) to the bioinformatics component.


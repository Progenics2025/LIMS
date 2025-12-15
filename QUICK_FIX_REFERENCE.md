# 🚀 Quick Fix: Multi-Sample Bioinformatics Send

## The Problem
- Created 4 lab process records from `no_of_samples=4` ✅
- Click "Send to Bioinformatics" → Only 1 record sent ❌
- 3 records with suffixes (_1, _2, _3, _4) don't get sent ❌

## The Solution
New endpoint sends **ALL records** with same unique_id to bioinformatics in one go.

## What Was Fixed

### 1. Backend (NEW)
**Endpoint**: `POST /api/send-to-bioinformatics-batch`
- Finds all records with the same unique_id
- Updates ALL to alert_sent = true
- Creates bioinformatics record for EACH

**Request**:
```json
{
  "uniqueId": "SAMPLE-123",
  "projectId": "DG-2025-001"
}
```

**Response**:
```json
{
  "recordsCreatedInBioinformatics": 4,
  "bioinformaticsIds": [100, 101, 102, 103]
}
```

### 2. Frontend (UPDATED)
**Button click now passes**:
```typescript
{
  labId: lab.id,
  uniqueId: lab.titleUniqueId,     // NEW
  projectId: lab.projectId          // NEW
}
```

**Mutation now calls**: New batch endpoint instead of individual record update

## Result

### Before
```
Click "Send to Bioinformatics"
↓
1 record sent ❌
1 bioinformatics record created ❌
```

### After
```
Click "Send to Bioinformatics" on ANY record
↓
ALL 4 records sent ✅
4 bioinformatics records created ✅
All with sample_id suffixes (_1, _2, _3, _4) ✅
```

## How to Test

### 1. Create test data
```bash
# Test endpoint directly
curl -X POST http://localhost:4000/api/send-to-bioinformatics-batch \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueId": "CLEAN-TEST-2025",
    "projectId": "DG-CLEAN-2025"
  }'
```

### 2. Verify in database
```sql
-- Check all 4 lab process records marked as sent
SELECT id, sample_id, alert_to_bioinformatics_team 
FROM labprocess_discovery_sheet 
WHERE unique_id = 'CLEAN-TEST-2025';
-- Should show: 4 records with alert_to_bioinformatics_team = 1

-- Check all 4 bioinformatics records created
SELECT id, unique_id, sample_id 
FROM bioinformatics_sheet_discovery 
WHERE unique_id = 'CLEAN-TEST-2025';
-- Should show 4 records with suffixes
```

## What Changed

| File | Change |
|------|--------|
| `/server/routes.ts` | Added new endpoint (95 lines) |
| `/client/src/pages/LabProcessing.tsx` | Updated mutation function (33 lines) |

## Status
✅ **Code changes complete**
✅ **Ready for testing**
⏳ **Server restart required**

## Next Steps
1. Server restart
2. Test with multi-sample workflow (4 samples)
3. Verify all 4 records sent to bioinformatics
4. Test with both discovery (DG) and clinical (PG) projects

---

## Visual Summary

```
OLD WAY:
┌─ Record 1 ──────────────────┐
│ unique_id: SAMPLE-123       │
│ sample_id: SAMPLE-123       │
│ Click "Send to Bio" →       │
│ Result: 1 bio record ❌     │
└─────────────────────────────┘
┌─ Record 2 ──────────────────┐
│ unique_id: SAMPLE-123       │
│ sample_id: SAMPLE-123_1     │
│ Not sent ❌                 │
└─────────────────────────────┘
(Repeat for records 3, 4)

NEW WAY:
┌─ Record 1 ──────────────────┐
│ unique_id: SAMPLE-123       │
│ sample_id: SAMPLE-123       │
│ Click "Send to Bio" →       │
│ Finds ALL 4 records ↓       │
└─────────────────────────────┘
┌─ Record 2 ──────────────────┐
│ unique_id: SAMPLE-123       │
│ sample_id: SAMPLE-123_1     │
│ Sent! ✅                    │
└─────────────────────────────┘
┌─ Record 3 ──────────────────┐
│ unique_id: SAMPLE-123       │
│ sample_id: SAMPLE-123_2     │
│ Sent! ✅                    │
└─────────────────────────────┘
┌─ Record 4 ──────────────────┐
│ unique_id: SAMPLE-123       │
│ sample_id: SAMPLE-123_3     │
│ Sent! ✅                    │
└─────────────────────────────┘

Result: 4 bio records created with suffixes ✅
```

## Questions?

See detailed docs:
- `FIX_BIOINFORMATICS_BATCH_SEND.md` - Full details
- `FIX_SUMMARY_BIOINFORMATICS_BATCH.md` - Implementation summary


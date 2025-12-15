# 🚀 Quick Start Guide: Multi-Sample Lab Process Feature

## What Does This Feature Do?

When a user alerts a sample to the lab processing team, **the system now automatically creates multiple lab process records** based on the `no_of_samples` value set in the lead.

### Example
- **Lead created with**: `no_of_samples = 4`
- **Old behavior**: Created 1 record in lab process sheet ❌
- **New behavior**: Creates 4 records with sample_id suffixes (_1, _2, _3, _4) ✅

---

## Frontend: How Users Use It

### Step 1: Create a Lead in Lead Management
```
Lead Management → Create Lead
├─ Service: WGS
├─ Sample Type: Blood
└─ NO_OF_SAMPLES: 4  ← IMPORTANT: Set this value
```

### Step 2: Create Sample in Sample Tracking
```
Sample Tracking → Create Sample
├─ Link to Lead created above
├─ Project ID: DG-2025-001 (or PG-xxx for clinical)
└─ Complete sample details
```

### Step 3: Alert to Lab Process
```
Sample Tracking Component
→ Click "Alert to Lab Process" button
→ System automatically creates 4 records
→ Each record has sample_id_1, _2, _3, _4
→ All 4 records have same unique_id
```

### Step 4: View in Lab Processing
```
Lab Processing Sheet
├─ Record 1: unique_id = LEAD-123, sample_id = LEAD-123_1
├─ Record 2: unique_id = LEAD-123, sample_id = LEAD-123_2
├─ Record 3: unique_id = LEAD-123, sample_id = LEAD-123_3
└─ Record 4: unique_id = LEAD-123, sample_id = LEAD-123_4
```

---

## Backend: Technical Details

### API Endpoint
```
POST /api/alert-lab-process
```

### Required Request Parameters
```json
{
  "sampleId": "LEAD-123",           // Sample identifier
  "uniqueId": "LEAD-123",           // Used to fetch lead data
  "projectId": "DG-2025-001"        // Routes to correct table
}
```

### Response (When Multiple Records Created)
```json
{
  "success": true,
  "recordIds": [9, 10, 11, 12],           // All created record IDs
  "numberOfRecordsCreated": 4,            // Number of records made
  "table": "labprocess_discovery_sheet",  // Which table used
  "message": "4 lab process record(s) created in labprocess_discovery_sheet"
}
```

### What Gets Created
```sql
-- In labprocess_discovery_sheet OR labprocess_clinical_sheet:
INSERT INTO labprocess_discovery_sheet (
  unique_id,      // LEAD-123 (same for all 4)
  sample_id,      // LEAD-123_1, LEAD-123_2, LEAD-123_3, LEAD-123_4
  service_name,   // WGS (same for all 4)
  sample_type,    // Blood (same for all 4)
  project_id,     // DG-2025-001 (same for all 4)
  no_of_samples,  // 4 (same for all 4)
  created_by,     // user@example.com
  created_at      // timestamp
);
```

---

## Database Records Comparison

### Before Feature (Old Way)
```
SELECT * FROM labprocess_discovery_sheet WHERE unique_id = 'LEAD-123';

Result: 1 record
┌────┬───────────┬──────────┐
│ id │unique_id  │sample_id │
├────┼───────────┼──────────┤
│ 1  │ LEAD-123  │ LEAD-123 │  ← Only 1 record, no suffix
└────┴───────────┴──────────┘
```

### After Feature (New Way)
```
SELECT * FROM labprocess_discovery_sheet WHERE unique_id = 'LEAD-123';

Result: 4 records
┌────┬───────────┬──────────────┐
│ id │unique_id  │  sample_id   │
├────┼───────────┼──────────────┤
│ 9  │ LEAD-123  │ LEAD-123_1   │
│ 10 │ LEAD-123  │ LEAD-123_2   │
│ 11 │ LEAD-123  │ LEAD-123_3   │
│ 12 │ LEAD-123  │ LEAD-123_4   │
└────┴───────────┴──────────────┘
```

---

## How It Works (Algorithm)

```
1. Frontend sends POST to /api/alert-lab-process with:
   - sampleId: "LEAD-123"
   - uniqueId: "LEAD-123"
   - projectId: "DG-2025-001"

2. Backend fetches lead data:
   SELECT no_of_samples FROM lead_management WHERE unique_id = "LEAD-123"
   → Returns: no_of_samples = 4

3. Backend loops 4 times:
   Loop iteration 1: Create record with sample_id = "LEAD-123_1"
   Loop iteration 2: Create record with sample_id = "LEAD-123_2"
   Loop iteration 3: Create record with sample_id = "LEAD-123_3"
   Loop iteration 4: Create record with sample_id = "LEAD-123_4"

4. Backend returns response with all 4 created record IDs

5. Frontend displays confirmation: "4 records created"
```

---

## Key Features

### ✅ Multiple Record Creation
- Creates N records based on `no_of_samples` field
- Backward compatible: Still creates 1 record if `no_of_samples` is null or 1

### ✅ Unique Identification
- All records share the same `unique_id` (for linking to lead)
- Each record has unique `sample_id` with suffix (_1, _2, _3, _4)
- Database constraint prevents duplicate (unique_id, sample_id) combinations

### ✅ Metadata Propagation
- `service_name` copied to all records
- `sample_type` copied to all records
- `project_id` copied to all records
- `no_of_samples` copied to all records

### ✅ Project-Based Routing
- DG prefix → `labprocess_discovery_sheet`
- PG prefix → `labprocess_clinical_sheet`

### ✅ Proper Error Handling
- Returns error if project ID doesn't match format
- Handles missing lead data gracefully
- Logs each step for debugging

---

## Testing Guide

### Quick Test with curl
```bash
# Create fresh test data
mysql -h localhost -u remote_user -p'Prolab#05' lead_lims2 << 'EOF'
INSERT INTO lead_management (id, unique_id, service_name, sample_type, no_of_samples)
VALUES (UUID(), 'TEST-2025-001', 'WGS', 'Blood', 4);

INSERT INTO sample_tracking (unique_id, project_id, created_by)
VALUES ('TEST-2025-001', 'DG-TEST-2025', 'test_user');
EOF

# Call the endpoint
curl -X POST http://localhost:4000/api/alert-lab-process \
  -H "Content-Type: application/json" \
  -d '{
    "sampleId": "TEST-2025-001",
    "uniqueId": "TEST-2025-001",
    "projectId": "DG-TEST-2025"
  }'

# Verify in database
mysql -h localhost -u remote_user -p'Prolab#05' lead_lims2 -e \
  "SELECT id, unique_id, sample_id FROM labprocess_discovery_sheet WHERE unique_id = 'TEST-2025-001';"
```

### Expected Output
```json
{
  "success": true,
  "recordIds": [9, 10, 11, 12],
  "numberOfRecordsCreated": 4,
  "table": "labprocess_discovery_sheet",
  "message": "4 lab process record(s) created in labprocess_discovery_sheet"
}
```

```
Database result should show 4 records with sample_ids: _1, _2, _3, _4
```

---

## Troubleshooting

### Issue: Only 1 record created instead of 4
**Solution**: Make sure you're passing `uniqueId` parameter. The system needs it to fetch `no_of_samples` from lead_management.

```bash
# ❌ WRONG - Missing uniqueId
curl -X POST http://localhost:4000/api/alert-lab-process \
  -d '{"sampleId":"TEST-2025","projectId":"DG-2025"}'

# ✅ CORRECT - Include uniqueId
curl -X POST http://localhost:4000/api/alert-lab-process \
  -d '{"sampleId":"TEST-2025","uniqueId":"TEST-2025","projectId":"DG-2025"}'
```

### Issue: Duplicate key error
**Solution**: Make sure your test unique_id doesn't already exist in the database.

```bash
# Delete old test records first
mysql -h localhost -u remote_user -p'Prolab#05' lead_lims2 << 'EOF'
DELETE FROM labprocess_discovery_sheet WHERE unique_id = 'TEST-2025';
DELETE FROM sample_tracking WHERE unique_id = 'TEST-2025';
DELETE FROM lead_management WHERE unique_id = 'TEST-2025';
EOF
```

### Issue: Project ID not recognized
**Solution**: Project ID must start with DG (discovery) or PG (clinical).

```bash
# ❌ WRONG
"projectId": "XX-2025-001"

# ✅ CORRECT
"projectId": "DG-2025-001"    # For discovery
"projectId": "PG-2025-001"    # For clinical
```

---

## Important Notes

### Database Constraint
The database has a UNIQUE constraint on `(unique_id, sample_id)` combination. This:
- ✅ Allows multiple records with same unique_id
- ❌ Prevents duplicate records with same (unique_id + sample_id)
- ✅ Allows sample_id_1, sample_id_2, sample_id_3, sample_id_4

### Backward Compatibility
The feature is fully backward compatible:
- If `no_of_samples` is NULL or not provided: Creates 1 record
- If `no_of_samples` is 1: Creates 1 record (no suffix)
- If `no_of_samples` is 2-N: Creates N records with suffixes

### Sample ID Suffix Format
- Suffix only applied when numberOfSamples > 1
- Format: `${sampleId}_${sampleNum}`
- Examples: LEAD-123_1, LEAD-123_2, LEAD-123_3, LEAD-123_4

---

## File Locations

| File | Purpose |
|------|---------|
| `/server/routes.ts` | Main implementation (lines 2790-2920) |
| `FEATURE_VERIFICATION_COMPLETE.md` | Test results and verification |
| `WORKFLOW_VISUAL_SUMMARY.md` | Before/after visual comparison |
| `IMPLEMENTATION_CODE_REFERENCE.md` | Detailed code reference |
| `QUICK_START_GUIDE.md` | This file |

---

## Summary

✅ **Feature is PRODUCTION READY**

Users can now:
1. Create leads with `no_of_samples` field set to 2, 3, 4, or more
2. Create sample tracking records for those leads
3. Click "Alert to Lab Process" button
4. System automatically creates N lab process records with properly suffixed sample IDs
5. All records maintain the same unique_id for tracking relationships
6. Records appear in Lab Processing sheet ready for further processing

The implementation has been tested with:
- Discovery projects (DG prefix) ✅
- Clinical projects (PG prefix) ✅
- Multiple sample counts (4 samples tested) ✅
- Both database tables ✅


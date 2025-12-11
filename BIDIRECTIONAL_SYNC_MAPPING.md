# Bidirectional Sync: Lead Management ↔ Process Master

## Overview
The system automatically syncs data between the **Lead Management** component (`lead_management` table) and **Process Master** component (`process_master_sheet` table). This bidirectional sync ensures data consistency across both views.

## Sync Architecture

### 1️⃣ Lead Management → Process Master
**When**: Automatically triggered when leads are created or updated
**Function**: `syncLeadToProcessMaster()` in `/server/routes.ts`

### 2️⃣ Process Master → Lead Management  
**When**: Automatically triggered when Process Master records are updated
**Function**: `syncProcessMasterToLead()` in `/server/routes.ts`

---

## Field Mapping Details

### ✅ Fields That Sync Bidirectionally

| Lead Management Field | Process Master Field | Data Type | Notes |
|----------------------|---------------------|-----------|-------|
| `uniqueId` | `unique_id` | String | Primary sync key (must match) |
| `projectId` | `project_id` | String | Project identifier |
| `sampleId` | `sample_id` | String | Sample identifier |
| `clientId` | `client_id` | String | Client identifier |
| `organisationHospital` | `organisation_hospital` | String | Organization/Hospital name |
| `clinicianResearcherName` | `clinician_researcher_name` | String | Doctor/Researcher name |
| `speciality` | `speciality` | String | Medical specialty |
| `clinicianResearcherEmail` | `clinician_researcher_email` | String | Clinician email |
| `clinicianResearcherPhone` | `clinician_researcher_phone` | String | Clinician phone |
| `clinicianResearcherAddress` | `clinician_researcher_address` | String | Clinician address |
| `patientClientName` | `patient_client_name` | String | Patient/Client name |
| `age` | `age` | Number | Patient age |
| `gender` | `gender` | String | Patient gender |
| `patientClientEmail` | `patient_client_email` | String | Patient email |
| `patientClientPhone` | `patient_client_phone` | String | Patient phone |
| `patientClientAddress` | `patient_client_address` | String | Patient address |
| `sampleCollectionDate` | `sample_collection_date` | Date | When sample collected |
| `sampleReceivedDate` | `sample_recevied_date` | Date | When sample received (note: typo in DB) |
| `serviceName` | `service_name` | String | Service type (WGS, WES, etc.) |
| `sampleType` | `sample_type` | String | Type of sample |
| `noOfSamples` | `no_of_samples` | Number | Number of samples |
| `tat` | `tat` | String | Turnaround time |
| `salesResponsiblePerson` | `sales_responsible_person` | String | Sales person responsible |
| `progenicsTrf` | `progenics_trf` | String | Progenics TRF URL/path |
| `remarkComment` | `Remark_Comment` | Text | Comments/remarks |

**Total Synced Fields**: 25 fields

---

### ❌ Fields That DON'T Sync (Process Master Only)

These fields exist ONLY in Process Master and are NOT synced back to Lead Management:

| Process Master Field | Purpose | Set By |
|---------------------|---------|--------|
| `third_party_trf` | Third party TRF document | Process Master only |
| `progenics_report` | Progenics report URL | Process Master only |
| `sample_sent_to_third_party_date` | Date sent to 3rd party | Process Master only |
| `third_party_name` | Name of third party lab | Process Master only |
| `third_party_report` | Third party report URL | Process Master only |
| `results_raw_data_received_from_third_party_date` | Date received from 3rd party | Process Master only |
| `logistic_status` | Logistics workflow status | Process Master only |
| `finance_status` | Finance workflow status | Process Master only |
| `lab_process_status` | Lab processing status | Process Master only |
| `bioinformatics_status` | Bioinformatics status | Process Master only |
| `nutritional_management_status` | Nutrition status | Process Master only |
| `progenics_report_release_date` | Report release date | Process Master only |

**Total Process Master Exclusive Fields**: 12 fields

---

## How Sync Works

### Scenario 1: Creating/Editing a Lead in Lead Management

```
User Action: Fill form in Lead Management → Click Save
    ↓
Backend: Create/Update lead_management record
    ↓
Backend: Automatically call syncLeadToProcessMaster()
    ↓
Backend: Check if Process Master record exists (by unique_id)
    ↓
    ├─ If EXISTS: Update existing Process Master record (only common fields)
    └─ If NOT EXISTS: Create new Process Master record
    ↓
Result: Both tables now have the data
```

**Triggers**:
- POST `/api/leads` (new lead creation)
- PUT `/api/leads/:id` (lead update)
- POST `/api/sync/leads-to-process-master` (manual bulk sync)

### Scenario 2: Editing in Process Master

```
User Action: Edit record in Process Master → Click Save
    ↓
Backend: Update process_master_sheet record
    ↓
Backend: Automatically call syncProcessMasterToLead()
    ↓
Backend: Find matching lead by unique_id
    ↓
    ├─ If FOUND: Update lead_management record (only common fields)
    └─ If NOT FOUND: Skip (no lead to update)
    ↓
Result: Both tables reflect the changes
```

**Triggers**:
- PUT `/api/process-master/:id` (Process Master update)

---

## Important Rules

### ✅ Sync Rules

1. **Unique ID is Key**: Sync matches records using `unique_id` field
2. **Non-Destructive**: Only updates fields that have values (doesn't overwrite with null)
3. **Automatic**: No manual action needed - happens on every create/update
4. **One-Way for Exclusive Fields**: Process Master exclusive fields (status fields, third party info) stay only in Process Master
5. **Timestamps**: Each table maintains its own `created_at`, `modified_at` timestamps

### ⚠️ Important Notes

1. **Database Typo**: The field is named `sample_recevied_date` (misspelled) in the database
2. **Status Fields**: Status fields (`logistic_status`, `finance_status`, etc.) are NOT synced back to Lead Management
3. **Third Party Fields**: All third-party related fields exist only in Process Master
4. **Field Priority**: When syncing from Process Master to Lead, Process Master values take precedence

---

## Testing the Bidirectional Sync

### Test 1: Lead → Process Master Sync

```bash
# Create a new lead
curl -X POST http://localhost:4000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueId": "SYNC_TEST_001",
    "projectId": "PG_SYNC_001",
    "patientClientName": "Sync Test Patient",
    "age": 35,
    "gender": "Male",
    "serviceName": "WGS",
    "tat": "30 days"
  }'

# Verify it appears in Process Master
curl -s http://localhost:4000/api/process-master | \
  jq '.[] | select(.unique_id == "SYNC_TEST_001")'
```

### Test 2: Process Master → Lead Sync

```bash
# Update the Process Master record
curl -X PUT http://localhost:4000/api/process-master/{ID} \
  -H "Content-Type: application/json" \
  -d '{
    "patient_client_name": "Updated from Process Master",
    "age": 36,
    "tat": "45 days"
  }'

# Verify it updated in Lead Management
curl -s http://localhost:4000/api/leads | \
  jq '.[] | select(.uniqueId == "SYNC_TEST_001")'
```

### Test 3: Process Master Exclusive Fields

```bash
# Update Process Master with exclusive fields
curl -X PUT http://localhost:4000/api/process-master/{ID} \
  -H "Content-Type: application/json" \
  -d '{
    "logistic_status": "Completed",
    "finance_status": "Pending",
    "lab_process_status": "In Progress",
    "third_party_name": "External Lab"
  }'

# Verify these fields DON'T appear in Lead Management
curl -s http://localhost:4000/api/leads | \
  jq '.[] | select(.uniqueId == "SYNC_TEST_001") | 
      {uniqueId, patientClientName, age, logistic_status, finance_status}'
# Should show: logistic_status and finance_status as null/undefined
```

---

## Code References

### Backend Sync Functions
- **File**: `/server/routes.ts`
- **Lead → PM Sync**: Lines 102-180 (`syncLeadToProcessMaster`)
- **PM → Lead Sync**: Lines 182-240 (`syncProcessMasterToLead`)

### Sync Triggers
- **Lead POST**: Line 565 (calls `syncLeadToProcessMaster`)
- **Lead PUT**: Line 734 (calls `syncLeadToProcessMaster`)
- **Process Master PUT**: Line 2255 (calls `syncProcessMasterToLead`)
- **Manual Bulk Sync**: Line 476 (POST `/api/sync/leads-to-process-master`)

### Frontend Components
- **Lead Management**: `/client/src/pages/LeadManagement.tsx`
- **Process Master**: `/client/src/pages/ProcessMaster.tsx`

---

## Troubleshooting

### Data not syncing?

1. **Check unique_id**: Sync requires matching `unique_id` in both tables
   ```sql
   SELECT unique_id FROM lead_management WHERE id = ?;
   SELECT unique_id FROM process_master_sheet WHERE id = ?;
   ```

2. **Check server logs**: Sync functions log their actions
   ```bash
   # Look for these log messages:
   [Sync] Lead synced to ProcessMaster: {unique_id}
   [Sync] ProcessMaster synced to Lead: {unique_id}
   ```

3. **Check field values**: Ensure fields have non-null values
   ```bash
   curl -s http://localhost:4000/api/leads/{id} | jq '.'
   curl -s http://localhost:4000/api/process-master/{id} | jq '.'
   ```

4. **Manual sync endpoint**: Force sync all leads to Process Master
   ```bash
   curl -X POST http://localhost:4000/api/sync/leads-to-process-master
   ```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| New lead doesn't appear in Process Master | Sync function failed | Check server logs for errors |
| Updates in PM don't reflect in Lead | `unique_id` mismatch | Verify both records have same `unique_id` |
| Status fields in Lead Management | Trying to access PM-only fields | Status fields only exist in Process Master |
| Null values overwriting data | Frontend sending undefined | Ensure form fields have values before saving |

---

## Recent Fixes (Nov 24, 2025)

### Fix 1: Genetic Counselling Duplicate Records

**Issue**: Creating 1 record in Genetic Counselling resulted in 3 duplicate entries in the database.

**Root Cause**: Race condition in `GeneticCounselling.tsx`:
1. POST request creates record on server
2. Code manually adds record to local state: `setRows([new, ...old])`
3. Code invalidates React Query cache, triggering refetch
4. When refetch completes, `useEffect` runs and calls `setRows(serverData)`
5. This causes the new record to be added multiple times

**Solution**: Removed manual state updates in the `onSave` function. Now React Query handles all state updates automatically:
```typescript
// BEFORE (caused duplicates)
const created = await res.json();
queryClient.invalidateQueries(...);
const normalized = normalizeServerRow(created);
setRows((s) => [normalized, ...s]); // ❌ Manual update

// AFTER (fixed)
await res.json();
queryClient.invalidateQueries(...); // ✅ Let React Query handle it
```

**Files Modified**:
- `/client/src/pages/GeneticCounselling.tsx` (lines 262-287)

**Testing**:
```bash
./test_genetic_counselling_duplicates.sh
```

**Cleanup Existing Duplicates** (if any):
```bash
./cleanup_gc_duplicates.sh
```

**Status**: ✅ Fixed - Browser reload required to load updated code

---

### Fix 2: Process Master → Lead Sync Not Working

## Recent Fix (Nov 24, 2025)

### Issue Fixed: Process Master → Lead Sync Not Working

**Problem**: When updating records in Process Master, changes were not syncing back to Lead Management.

**Root Cause**: The `syncProcessMasterToLead()` function was mapping PM fields to incorrect camelCase field names instead of the actual database column names (snake_case).

**Solution**: Updated field mapping to use snake_case database column names:
```typescript
// BEFORE (incorrect - camelCase)
'patient_client_name': 'patientClientName'

// AFTER (correct - snake_case)  
'patient_client_name': 'patient_client_name'
```

**Status**: ✅ Fixed in `/server/routes.ts` (lines 200-270)

### Testing the Fix

After **restarting the server**, run:
```bash
./test_bidirectional_sync_complete.sh
```

This comprehensive test will verify:
- ✓ Process Master → Lead sync (all 25 fields)
- ✓ Lead → Process Master sync (all 25 fields)  
- ✓ Exclusive PM fields don't leak to Lead (12 fields)

---

## Summary

✅ **25 fields** sync bidirectionally between Lead Management and Process Master
❌ **12 fields** exist only in Process Master (status fields, third-party info)
🔄 **Automatic sync** on every create/update operation
🔑 **unique_id** field is the sync key - must match in both tables

**Best Practice**: 
- Use Lead Management for initial lead capture and patient/sample info
- Use Process Master for workflow tracking and third-party coordination
- Both views stay automatically synchronized for common fields

**Important**: Server restart required after code changes for sync to work properly.

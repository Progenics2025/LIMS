# ProcessMaster Sync - Fix & Implementation Guide

## Problem Summary

1. ✅ **Backend sync functions were called but NOT DEFINED** - Fixed
2. ✅ **ProcessMaster table was empty** - Now has sync capability
3. ✅ **Not all lead fields were being synced** - Now syncs all available fields

## Solution Applied

### 1. Added Complete Sync Functions to `server/routes.ts`

**Location**: Before `registerRoutes()` function

**Two new helper functions added:**

#### `syncLeadToProcessMaster(lead, isUpdate)`
- Syncs lead data to ProcessMaster table
- Called automatically on:
  - Lead creation (`POST /api/leads`)
  - Lead updates (`PUT /api/leads/:id`)
- Maps ALL lead fields to ProcessMaster columns
- Creates new or updates existing ProcessMaster record

**Fields Synced:**
```
Lead → ProcessMaster
uniqueId → unique_id
projectId → project_id
organisationHospital → organisation_hospital
clinicianResearcherName → clinician_researcher_name
clinicianResearcherEmail → clinician_researcher_email
clinicianResearcherPhone → clinician_researcher_phone
clinicianResearcherAddress → clinician_researcher_address
patientClientName → patient_client_name
patientClientEmail → patient_client_email
patientClientPhone → patient_client_phone
patientClientAddress → patient_client_address
sampleCollectionDate → sample_collection_date
sampleReceivedDate → sample_recevied_date
serviceName → service_name
sampleType → sample_type
noOfSamples → no_of_samples
tat → tat
salesResponsiblePerson → sales_responsible_person
progenicsTrf → progenics_trf
remarkComment → Remark_Comment
speciality → speciality
age → age
gender → gender
```

#### `syncProcessMasterToLead(pmRecord)`
- Bidirectional sync
- Called automatically on ProcessMaster updates (`PUT /api/process-master/:id`)
- Maps ProcessMaster fields back to lead
- Updates corresponding lead in lead_management table

### 2. Added Manual Sync Endpoint

**Endpoint**: `POST /api/sync/leads-to-process-master`

**Purpose**: One-time synchronization of ALL existing leads to ProcessMaster

**Why needed**: Existing leads in database were created BEFORE sync logic was implemented, so they need manual sync

**Response**:
```json
{
  "message": "Sync completed: 5 leads synced, 0 failed",
  "synced": 5,
  "failed": 0,
  "total": 5
}
```

## Implementation Steps

### Step 1: Restart Server with New Build
```bash
cd "/home/progenics-bioinfo/LeadLab_LIMS/LeadLab_LIMS v2.5 (copy of 2.3) 21_11_25"
npm run build
npm run dev
```

### Step 2: Trigger One-Time Manual Sync

Run this curl command to sync all existing leads to ProcessMaster:

```bash
curl -X POST http://localhost:4000/api/sync/leads-to-process-master \
  -H "Content-Type: application/json"
```

Expected output:
```json
{
  "message": "Sync completed: 5 leads synced, 0 failed",
  "synced": 5,
  "failed": 0,
  "total": 5
}
```

**What happens**:
- Gets all leads from `lead_management` table
- For each lead, creates a record in `process_master_sheet` table
- Populates ALL available fields
- Logs progress to server console

### Step 3: Verify Data in Database

Check that ProcessMaster table is now populated:

```sql
-- Check ProcessMaster record count
SELECT COUNT(*) as total_records FROM process_master_sheet;

-- View all records
SELECT unique_id, project_id, organisation_hospital, patient_client_name, 
       sample_collection_date, service_name FROM process_master_sheet;

-- Verify specific record
SELECT * FROM process_master_sheet 
WHERE unique_id = 'SA_XYZ123'; -- Replace with actual unique_id
```

### Step 4: View in ProcessMaster UI

1. Restart frontend (Vite dev server if using it)
2. Navigate to `/process-master` page
3. Verify all leads appear with complete data:
   - Organization name
   - Clinician name
   - Patient name
   - Service name
   - Sample collection date
   - All other fields

## Data Flow After Implementation

### Creating a New Lead
```
LeadManagement Form
  ↓ (Submit)
POST /api/leads
  ↓
Backend creates lead in lead_management
  ↓
syncLeadToProcessMaster() [AUTOMATIC]
  ↓
ProcessMaster record created in process_master_sheet
  ↓
ProcessMaster UI shows new lead
```

### Editing Lead in LeadManagement
```
LeadManagement Dialog
  ↓ (Save)
PUT /api/leads/:id
  ↓
Backend updates lead in lead_management
  ↓
syncLeadToProcessMaster() [AUTOMATIC]
  ↓
ProcessMaster record updated
  ↓
ProcessMaster UI reflects changes
```

### Editing Record in ProcessMaster
```
ProcessMaster Dialog
  ↓ (Save)
PUT /api/process-master/:id
  ↓
Backend updates process_master_sheet
  ↓
syncProcessMasterToLead() [AUTOMATIC]
  ↓
Lead updated in lead_management
  ↓
LeadManagement shows changes on next refresh
```

## Testing Checklist

- [ ] Build successful: `npm run build` shows 0 errors
- [ ] Server starts: `npm run dev` runs without errors
- [ ] Manual sync endpoint works: `POST /api/sync/leads-to-process-master` returns success
- [ ] ProcessMaster table populated: `SELECT COUNT(*) FROM process_master_sheet` > 0
- [ ] ProcessMaster UI shows all leads with complete data
- [ ] Create new lead in LeadManagement → appears immediately in ProcessMaster
- [ ] Edit lead in LeadManagement → ProcessMaster updates automatically
- [ ] Edit ProcessMaster record → changes sync back to lead_management

## Database Schema Verification

The `process_master_sheet` table includes all necessary columns:

```sql
CREATE TABLE `process_master_sheet` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `unique_id` varchar(255) NOT NULL,
  `project_id` bigint unsigned DEFAULT NULL,
  `organisation_hospital` varchar(255) DEFAULT NULL,
  `clinician_researcher_name` varchar(255) DEFAULT NULL,
  `patient_client_name` varchar(255) DEFAULT NULL,
  `sample_collection_date` date DEFAULT NULL,
  `sample_recevied_date` date DEFAULT NULL,
  `service_name` varchar(255) DEFAULT NULL,
  `sample_type` varchar(255) DEFAULT NULL,
  `no_of_samples` int DEFAULT NULL,
  `tat` varchar(100) DEFAULT NULL,
  `sales_responsible_person` varchar(255) DEFAULT NULL,
  `progenics_trf` varchar(255) DEFAULT NULL,
  -- ... and many more fields
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_process_unique_id` (`unique_id`)
);
```

## Troubleshooting

### ProcessMaster table still empty after sync

**Problem**: Sync endpoint called but no data appears

**Solution**:
1. Check server logs for `[SYNC]` messages:
   ```
   [SYNC] Starting manual sync of all leads to ProcessMaster...
   [Sync] Lead synced to ProcessMaster: SA_ABC123
   [SYNC] Sync completed: 5/5 leads synced to ProcessMaster
   ```

2. Verify leads exist in lead_management:
   ```sql
   SELECT COUNT(*) FROM lead_management;
   ```

3. Check for errors:
   ```sql
   -- Look for orphaned records without unique_id
   SELECT * FROM lead_management WHERE unique_id IS NULL;
   ```

### ProcessMaster shows old data

**Problem**: New lead fields not appearing in ProcessMaster

**Solution**:
1. Refresh browser (Ctrl+F5 hard refresh)
2. Check React Query cache is invalidated
3. Verify sync logs in server console

### Field values showing as NULL

**Problem**: Some fields synced as NULL instead of data

**Solution**:
1. Check lead_management table has the data:
   ```sql
   SELECT * FROM lead_management WHERE id = 'xyz';
   ```

2. Verify field name mapping matches schema
3. Check for date field formatting issues (TIMESTAMP vs DATE)

## Build Status

✅ **Latest Build**: Successful
- No TypeScript errors
- No compilation warnings
- All modules compiled: 2797 modules
- Bundle size: 1,541.32 kB (minified)

## Files Modified

1. **server/routes.ts**
   - Added `syncLeadToProcessMaster()` function
   - Added `syncProcessMasterToLead()` function
   - Added `POST /api/sync/leads-to-process-master` endpoint
   - Integrated sync into existing endpoints (POST/PUT /api/leads, PUT /api/process-master)

2. **client/src/pages/ProcessMaster.tsx**
   - Changed data source to `/api/process-master`
   - Added data merge logic
   - Updated CRUD operations for bidirectional sync

## Next Steps

1. ✅ Build successful
2. ✅ Sync functions implemented
3. → Restart server with new build
4. → Run manual sync endpoint
5. → Verify ProcessMaster table populated
6. → Test creating/editing leads
7. → Confirm bidirectional sync working

All code is ready - just need to run the sync endpoint!

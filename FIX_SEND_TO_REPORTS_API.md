# Fix: Send to Reports API - Using report_management Table

## Problem Statement
The `/api/send-to-reports` endpoint was trying to insert data into non-existent tables (`report_clinical_sheet` and `report_discovery_sheet`), causing the following error:

```json
{
    "message": "Failed to send bioinformatics record to Reports",
    "error": "Table 'lead_lims2.report_clinical_sheet' doesn't exist"
}
```

## Solution
Changed the `/api/send-to-reports` endpoint to insert data directly into the `report_management` table instead of trying to use non-existent report-specific tables.

---

## Changes Made

### File: `/server/routes.ts`

**Location:** Lines 1747-1876 (approximately)

**Changes:**
1. Updated endpoint to accept all required fields from bioinformatics:
   - IDs: `uniqueId`, `projectId`, `bioinformaticsId`, `sampleId`, `clientId`
   - Patient info: `patientClientName`, `age`, `gender`
   - Clinician info: `clinicianResearcherName`, `organisationHospital`
   - Service info: `serviceName`, `noOfSamples`
   - TAT & comments: `tat`, `remarkComment`
   - Optional lead fields: `createdBy`, `modifiedBy`
   - Additional fields: `analysisDate`, `sampleReceivedDate`

2. Directly insert into `report_management` table instead of routing to different tables

3. Proper field mapping to `report_management` schema:
   - `uniqueId` → `unique_id` (PRIMARY KEY)
   - `projectId` → `project_id`
   - `patientClientName` → `patient_client_name`
   - `age` → `age` (converted to integer)
   - `gender` → `gender`
   - `clinicianResearcherName` → `clinician_researcher_name`
   - `organisationHospital` → `organisation_hospital`
   - `serviceName` → `service_name`
   - `noOfSamples` → `no_of_samples` (converted to integer)
   - `tat` → `tat` (converted to integer)
   - `remarkComment` → `remark_comment`
   - `createdBy` → `lead_created_by`
   - `modifiedBy` → `lead_modified`
   - `sampleReceivedDate` → `sample_received_date` (converted to DATE format)

### Key Implementation Features:

```typescript
// All fields from bioinformatics are extracted
const {
  uniqueId, projectId, bioinformaticsId, sampleId, clientId,
  patientClientName, age, gender,
  clinicianResearcherName, organisationHospital,
  serviceName, noOfSamples,
  tat, remarkComment,
  createdBy, modifiedBy,
  analysisDate, sampleReceivedDate,
} = req.body;

// Data is prepared with conditional inclusion
const reportData = {
  unique_id: uniqueId,
  project_id: projectId,
  patient_client_name: patientClientName,
  age: parseInt(age) || null,
  gender: gender,
  clinician_researcher_name: clinicianResearcherName,
  organisation_hospital: organisationHospital,
  service_name: serviceName,
  no_of_samples: parseInt(noOfSamples) || null,
  tat: parseInt(tat) || null,
  remark_comment: remarkComment,
  lead_created_by: createdBy,
  lead_modified: modifiedBy || new Date(),
  sample_received_date: /* converted to DATE format */,
  created_at: new Date(),
};

// Dynamic query builder for flexibility
const result = await pool.execute(
  `INSERT INTO report_management (${cols}) VALUES (${placeholders})`,
  values
);
```

---

## Data Flow

```
┌──────────────────────────────────────────────────┐
│ Bioinformatics Component                        │
│ Click "Send to Reports" button                  │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ POST /api/send-to-reports                       │
│ With all bioinformatics data fields             │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ Backend: Prepare data for report_management     │
│ - Extract all fields                            │
│ - Convert data types (int, dates)              │
│ - Build dynamic INSERT query                    │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ INSERT INTO report_management                   │
│ ✓ Insert new record with bioinformatics data   │
│ ✓ Update bioinformatics alert_to_report_team   │
│ ✓ Send notification                             │
└────────────────┬─────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ Response to Frontend                            │
│ {                                               │
│   "success": true,                              │
│   "recordId": uniqueId,                         │
│   "table": "report_management",                 │
│   "message": "..."                              │
│ }                                               │
└──────────────────────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│ Frontend Navigation                             │
│ - Navigate to /report-management                │
│ - Open form with pre-populated data             │
│ - User completes and saves                      │
└──────────────────────────────────────────────────┘
```

---

## Database Mapping

### report_management Table Schema

| Column | Type | Source Field | Mapping |
|--------|------|--------------|---------|
| `unique_id` | VARCHAR(255) PRIMARY KEY | `uniqueId` | Direct |
| `project_id` | VARCHAR(255) | `projectId` | Direct |
| `patient_client_name` | VARCHAR(255) | `patientClientName` | Direct |
| `age` | INTEGER | `age` | Parse to int |
| `gender` | VARCHAR(50) | `gender` | Direct |
| `clinician_researcher_name` | VARCHAR(255) | `clinicianResearcherName` | Direct |
| `organisation_hospital` | VARCHAR(255) | `organisationHospital` | Direct |
| `service_name` | VARCHAR(255) | `serviceName` | Direct |
| `no_of_samples` | INTEGER | `noOfSamples` | Parse to int |
| `tat` | INTEGER | `tat` | Parse to int |
| `remark_comment` | TEXT | `remarkComment` | Direct |
| `lead_created_by` | VARCHAR(255) | `createdBy` | Direct |
| `lead_modified` | TIMESTAMP | `modifiedBy` | Current time if null |
| `sample_received_date` | DATE | `sampleReceivedDate` | Convert to YYYY-MM-DD |
| `created_at` | TIMESTAMP | Auto | Current timestamp |

---

## Side Effects

### Bioinformatics Table Updates
When send-to-reports succeeds, the bioinformatics record is also updated:

```sql
UPDATE bioinfo_discovery_sheet  -- or bioinfo_clinical_sheet
SET alert_to_report_team = 1, modified_at = NOW()
WHERE id = ?
```

This flags the bioinformatics record as having been sent to reports.

### Notifications
Notification service is called to notify relevant users about the new report creation.

---

## Error Handling

1. **Missing unique_id**: Returns 400 with message "Unique ID is required"
2. **Missing project_id**: Returns 400 with message "Project ID is required"
3. **Database insert failure**: Returns 500 with detailed error message
4. **Bioinformatics update failure**: Logged as warning, doesn't fail the request
5. **Notification failure**: Logged as warning, doesn't fail the request

---

## Testing the Fix

### Test Steps:
1. Navigate to Bioinformatics component
2. Find a bioinformatics record
3. Click "Send to Reports" button
4. Should see success notification
5. Automatically navigate to Report Management
6. Form should open with pre-populated fields from bioinformatics
7. User can complete remaining fields and save
8. Check database: New record should exist in `report_management` table

### Success Indicators:
- ✓ No database table error
- ✓ Toast notification shows success
- ✓ Redirects to ReportManagement automatically
- ✓ Form is pre-populated with bioinformatics data
- ✓ New record appears in report_management table
- ✓ Bioinformatics record shows "Sent ✓" status

---

## Related Frontend Changes

The frontend also sends all these new fields (implemented in previous changes):
- See: `AUTO_POPULATE_BIOINFORMATICS_TO_REPORTS_GUIDE.md`

The frontend now sends a complete set of fields instead of just the basic ones:
```typescript
const response = await apiRequest('POST', '/api/send-to-reports', {
  // IDs
  bioinformaticsId: record.id,
  uniqueId: record.uniqueId,
  projectId: record.projectId,
  // Patient info
  patientClientName: record.patientClientName,
  age: record.age,
  gender: record.gender,
  // Clinician info
  clinicianResearcherName: record.clinicianResearcherName,
  organisationHospital: record.organisationHospital,
  // Service info
  serviceName: record.serviceName,
  noOfSamples: record.noOfSamples,
  // TAT and comments
  tat: record.tat,
  remarkComment: record.remarkComment,
  // Optional lead fields
  createdBy: record.createdBy,
  modifiedBy: record.modifiedBy,
  // Additional useful fields
  sampleId: record.sampleId,
  analysisDate: record.analysisDate,
  sampleReceivedDate: record.sampleReceivedDate,
  clientId: record.clientId,
});
```

---

## Notes

1. **Unique ID as Primary Key**: The `report_management` table uses `unique_id` as the PRIMARY KEY, so this must be unique and is required.

2. **Data Type Conversions**: The endpoint properly handles type conversions:
   - String to integer for `age`, `no_of_samples`, `tat`
   - Date string to YYYY-MM-DD format for `sample_received_date`

3. **Optional Fields**: All fields except `unique_id` and `project_id` are optional and only added if provided.

4. **Bioinformatics Flag**: The bioinformatics record is marked with `alert_to_report_team = 1` to track that it has been sent to reports.

5. **Audit Trail**: Fields `lead_created_by` and `lead_modified` provide an audit trail of who created/modified the report request.

---

## Troubleshooting

If you still see database errors:

1. **Check table exists**:
   ```sql
   SHOW TABLES LIKE 'report_management';
   DESC report_management;
   ```

2. **Check field types match**:
   ```sql
   DESCRIBE report_management;
   ```

3. **Check data is being sent**:
   - Look at browser Network tab → send-to-reports request
   - Check server logs for "Prepared report data for report_management"

4. **Verify pool connection**:
   - Check MySQL connection is active
   - Verify database name is correct

---

**Implementation Date:** December 16, 2025
**Status:** Complete and Ready for Testing

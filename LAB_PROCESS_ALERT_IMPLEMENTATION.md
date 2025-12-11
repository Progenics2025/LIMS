# Lab Process Alert Implementation - Complete Summary

## Overview
Successfully implemented "Alert Lab Process" functionality that automatically creates records in the appropriate lab process sheet (clinical or discovery) based on the project ID prefix when the user clicks the "Alert Lab Process" button in the Sample Tracking component.

## Key Features
1. **Project ID-Based Routing**: 
   - `DG` prefix → `lab_process_discovery_sheet` table
   - `PG` prefix → `lab_process_clinical_sheet` table

2. **Automatic Field Population**:
   - Maps sample tracking data to lab process sheet fields
   - Includes: unique_id, project_id, sample_id, sample_type, service_type, patient_name, age, gender, clinician_name, organization, speciality, budget, status, comments, created_by, created_at

3. **Database Flag Update**:
   - Sets `alert_to_labprocess_team` flag in sample_tracking table
   - Prevents duplicate alerts on the same sample

## Files Modified

### 1. `/server/routes.ts`
**Location**: Added new endpoints between line 1949-2061

**Changes**:
- Added direct SQL routes for `lab_process_discovery_sheet`:
  - `GET /api/labprocess-discovery-sheet` - Retrieve all discovery lab process records
  - `POST /api/labprocess-discovery-sheet` - Create new discovery lab process record
  - `PUT /api/labprocess-discovery-sheet/:id` - Update discovery lab process record
  - `DELETE /api/labprocess-discovery-sheet/:id` - Delete discovery lab process record

- Added direct SQL routes for `lab_process_clinical_sheet`:
  - `GET /api/labprocess-clinical-sheet` - Retrieve all clinical lab process records
  - `POST /api/labprocess-clinical-sheet` - Create new clinical lab process record
  - `PUT /api/labprocess-clinical-sheet/:id` - Update clinical lab process record
  - `DELETE /api/labprocess-clinical-sheet/:id` - Delete clinical lab process record

- Added new routing endpoint: `POST /api/alert-lab-process`
  - Accepts sample data from frontend
  - Detects project ID prefix (DG vs PG)
  - Routes to appropriate table
  - Creates lab process record with field mapping
  - Updates sample_tracking flag
  - Returns success response with table name

### 2. `/client/src/pages/SampleTracking.tsx`
**Location**: Lines 211-247 (mutation definition) and line 488 (button click)

**Changes**:
- Updated `alertLabProcessMutation`:
  - Changed from simple PUT operation to comprehensive POST operation
  - Now passes entire sample object with all required fields to `/api/alert-lab-process` endpoint
  - Invalidates queries for both lab process sheet tables (discovery and clinical)
  - Updated success message to indicate which table was used

- Updated button click handler:
  - Changed from `alertLabProcessMutation.mutate({ sampleId: sample.id })`
  - To: `alertLabProcessMutation.mutate(sample)`
  - Passes complete sample data to mutation function

## Implementation Pattern

The implementation follows the established pattern from previous features (genetic counselling and nutritional management auto-creation):

```typescript
// Backend: Project ID routing logic
if (projectId.startsWith('DG')) {
  // Insert into lab_process_discovery_sheet
} else if (projectId.startsWith('PG')) {
  // Insert into lab_process_clinical_sheet
}

// Field mapping
const labProcessData = {
  unique_id: uniqueId,
  project_id: projectId,
  sample_id: sampleId,
  // ... other mapped fields
};

// Direct SQL INSERT with parameterized query
const [result] = await pool.execute(
  `INSERT INTO ${tableName} (columns) VALUES (placeholders)`,
  values
);
```

## Data Flow

1. **User Action**: Clicks "Alert Lab Process" button in Sample Tracking component
2. **Frontend**: 
   - Collects all sample data from the row
   - Calls `alertLabProcessMutation.mutate(sample)`
   - Sends POST request to `/api/alert-lab-process` with sample data
3. **Backend**:
   - Receives sample data at `/api/alert-lab-process`
   - Extracts projectId and checks prefix (DG or PG)
   - Creates labProcessData object with field mapping
   - Executes INSERT into appropriate table (lab_process_discovery_sheet or lab_process_clinical_sheet)
   - Updates sample_tracking table to set alert_to_labprocess_team = true
   - Returns success response with table name and record ID
4. **Frontend**:
   - Receives success response
   - Invalidates sample-tracking, labprocess-discovery-sheet, and labprocess-clinical-sheet queries
   - Shows success toast with table name indication
   - Button becomes disabled/changes to amber color to prevent duplicate alerts

## Error Handling

- Invalid project ID prefix → Returns 400 error with descriptive message
- Database errors → Caught and returned with 500 error
- Sample flag update failure → Logged as warning, doesn't fail the entire request
- Frontend error handling → Shows error toast with descriptive message

## Testing

Created `test-lab-process.ts` test file that validates:
1. Creating clinical sample with PG project
2. Creating discovery sample with DG project  
3. Alerting lab process for clinical sample (verifies goes to lab_process_clinical_sheet)
4. Alerting lab process for discovery sample (verifies goes to lab_process_discovery_sheet)
5. Querying records from both tables to verify creation
6. Verifying all fields are populated correctly

## Build Status
✅ Build successful with no errors
- Vite build: 2798 modules transformed
- ESBuild server bundle: 290.6kb

## Database Requirements

Ensure the following tables exist with appropriate schema:
- `lab_process_discovery_sheet` - For DG project records
- `lab_process_clinical_sheet` - For PG project records

Both tables should have columns:
- id (primary key, auto-increment)
- unique_id
- project_id
- sample_id
- sample_type
- service_type
- patient_name
- age
- gender
- clinician_name
- organization
- speciality
- budget
- status
- comments
- lab_processing_team
- created_by
- created_at
- updated_at (optional)

## Query Cache Invalidation

The implementation properly invalidates the following React Query keys after successful alert:
- `/api/sample-tracking` - Refreshes sample list to show updated flag
- `/api/labprocess-discovery-sheet` - Refreshes discovery lab process records
- `/api/labprocess-clinical-sheet` - Refreshes clinical lab process records

## Button State Management

The "Alert Lab Process" button:
- Disabled while mutation is pending (isPending)
- Disabled after alert is sent (alertToLabprocessTeam flag = true)
- Color changes from blue to amber after alert is sent
- Shows appropriate tooltip text based on state

## Logging

Comprehensive console logging added for debugging:
- Sample data received at endpoint
- Project ID analysis (DG/Clinical detection)
- Table name determination
- Successful INSERT with record ID
- Sample tracking flag update confirmation
- Any warnings or errors during execution

---

## Next Steps (Optional Enhancements)

1. Add audit trail logging for lab process alerts
2. Send notification to lab processing team when alert is created
3. Add bulk alert functionality (select multiple samples)
4. Implement lab process status tracking workflow
5. Add lab process record view/edit functionality in sample tracking component

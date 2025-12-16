# Auto-Population from Bioinformatics to Report Management

## Overview
This implementation enables automatic population of report management fields when clicking the "Send to Reports" button in the Bioinformatics component. All required fields from the bioinformatics data are transferred and pre-filled in the report management form.

## Implementation Details

### Files Modified

#### 1. **Bioinformatics.tsx** (`/client/src/pages/Bioinformatics.tsx`)

**Changes Made:**
- Added `useLocation` hook import from `wouter` for navigation
- Added `setLocation` from `useLocation()` hook to enable navigation
- Enhanced `sendToReportsMutation` to send all required fields:
  - **IDs:** `uniqueId`, `projectId`
  - **Patient Info:** `patientClientName`, `age`, `gender`
  - **Clinician Info:** `clinicianResearcherName`, `organisationHospital`
  - **Service Info:** `serviceName`, `noOfSamples`
  - **TAT & Comments:** `tat`, `remarkComment`
  - **Optional Lead Fields:** `createdBy`, `modifiedBy`
  - **Additional Fields:** `sampleId`, `analysisDate`, `clientId`, `sampleReceivedDate`

**Key Implementation:**
```typescript
// Enhanced mutation to send complete data
const sendToReportsMutation = useMutation({
  mutationFn: async (record: BIRecord) => {
    const response = await apiRequest('POST', '/api/send-to-reports', {
      // All required fields are sent here
      bioinformaticsId: record.id,
      uniqueId: record.uniqueId,
      projectId: record.projectId,
      // ... all other fields
    });
    return response.json();
  },
  onSuccess: (data: any, recordData: any) => {
    // Store bioinformatics data in sessionStorage
    const bioinformationData = {
      uniqueId: recordData.uniqueId,
      projectId: recordData.projectId,
      patientClientName: recordData.patientClientName,
      age: recordData.age,
      gender: recordData.gender,
      // ... all other fields
    };
    
    sessionStorage.setItem('bioinformatics_send_to_reports', JSON.stringify(bioinformationData));
    
    // Navigate to Report Management
    setTimeout(() => {
      setLocation('/report-management');
    }, 1000);
  }
});
```

#### 2. **ReportManagement.tsx** (`/client/src/pages/ReportManagement.tsx`)

**Changes Made:**
- Added `useLocation` hook import from `wouter`
- Added `useLocation()` hook to track navigation
- Added `autoPopulatedData` and `setAutoPopulatedData` state
- Created `useEffect` hook to detect bioinformatics data in sessionStorage
- Implemented `openNewRecordWithBioData()` function to auto-populate form fields
- Updated form initialization to handle bioinformatics data

**Key Implementation:**
```typescript
// Import useLocation
import { useLocation } from "wouter";

// Hook to detect and process auto-population data
useEffect(() => {
  const bioinformationData = sessionStorage.getItem('bioinformatics_send_to_reports');
  if (bioinformationData) {
    try {
      const data = JSON.parse(bioinformationData);
      setAutoPopulatedData(data);
      sessionStorage.removeItem('bioinformatics_send_to_reports');
      
      if (data) {
        setTimeout(() => {
          openNewRecordWithBioData(data);
        }, 300);
      }
    } catch (e) {
      console.error('Failed to parse bioinformatics data:', e);
    }
  }
}, [location]);

// Function to open form with pre-populated data
const openNewRecordWithBioData = (bioData: any) => {
  const newForm = {
    unique_id: bioData.uniqueId ?? '',
    project_id: bioData.projectId ?? '',
    organisation_hospital: bioData.organisationHospital ?? '',
    clinician_researcher_name: bioData.clinicianResearcherName ?? '',
    patient_client_name: bioData.patientClientName ?? '',
    age: bioData.age ?? '',
    gender: bioData.gender ?? '',
    service_name: bioData.serviceName ?? '',
    tat: bioData.tat ?? '',
    no_of_samples: bioData.noOfSamples ?? '',
    sample_received_date: bioData.sampleReceivedDate ? String(bioData.sampleReceivedDate).split('T')[0] : '',
    lead_created_by: bioData.createdBy ?? '',
    lead_modified: bioData.modifiedBy ?? '',
    remark_comment: bioData.remarkComment ?? '',
    // ... other empty fields
  };
  
  setEditRecord(null);
  setEditForm(newForm);
  setIsEditOpen(true);
  
  toast({
    title: 'New Report',
    description: 'Form pre-populated with bioinformatics data. Please complete and save.',
  });
};
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Send to Reports" in Bioinformatics component  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ sendToReportsMutation triggers                             │
│ - Sends complete bioinformatics record data               │
│ - POST to /api/send-to-reports endpoint                  │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ onSuccess handler                                          │
│ - Stores data in sessionStorage                           │
│ - Shows success toast                                     │
│ - Navigates to /report-management                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ ReportManagement component mounts                          │
│ - Detects bioinformatics data in sessionStorage           │
│ - Calls openNewRecordWithBioData()                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│ Form Dialog opens with pre-populated fields                │
│ User completes remaining fields and saves                 │
│ New report record created in report_management table      │
└─────────────────────────────────────────────────────────────┘
```

## Fields Populated

### From Bioinformatics → To Report Management

| Bioinformatics Field | Report Management Field | Type |
|---------------------|------------------------|------|
| `uniqueId` | `unique_id` | ID |
| `projectId` | `project_id` | ID |
| `patientClientName` | `patient_client_name` | Patient Info |
| `age` | `age` | Patient Info |
| `gender` | `gender` | Patient Info |
| `clinicianResearcherName` | `clinician_researcher_name` | Clinician Info |
| `organisationHospital` | `organisation_hospital` | Clinician Info |
| `serviceName` | `service_name` | Service Info |
| `noOfSamples` | `no_of_samples` | Service Info |
| `tat` | `tat` | TAT & Comments |
| `remarkComment` | `remark_comment` | TAT & Comments |
| `createdBy` | `lead_created_by` | Optional Lead Fields |
| `modifiedBy` | `lead_modified` | Optional Lead Fields |
| `sampleReceivedDate` | `sample_received_date` | Additional |

## User Experience Flow

1. **Bioinformatics Component**
   - User views a bioinformatics record
   - Clicks the green "Send to Reports" button
   - Button shows loading state while processing
   - Success toast appears

2. **Navigation**
   - User is automatically redirected to Report Management after 1 second
   - No manual navigation required

3. **Report Management Component**
   - A new edit dialog automatically opens
   - All available bioinformatics fields are pre-filled
   - Empty fields are ready for user input:
     - `report_url`
     - `report_release_date`
     - `clinician_researcher_email`
     - `clinician_researcher_phone`
     - `clinician_researcher_address`
     - `patient_client_email`
     - `patient_client_phone`
     - `patient_client_address`
     - `sample_type`
     - `progenics_trf`
     - `sales_responsible_person`
     - `gc_case_summary`
   - User completes the form and saves

4. **Data Persistence**
   - sessionStorage is cleared after reading
   - Form data is persisted to database
   - Button in Bioinformatics now shows "Sent ✓" and is disabled

## Technical Details

### Session Storage Usage
- **Key:** `bioinformatics_send_to_reports`
- **Format:** JSON string
- **Lifetime:** Until page reload or manual clear
- **Auto-cleanup:** Cleared immediately after reading in ReportManagement

### Navigation Method
- Using `wouter` router (`setLocation` from `useLocation()`)
- Navigates to `/report-management` route
- No page reload required

### Error Handling
- `try-catch` block in useEffect for JSON parsing
- Console error logging for debugging
- Graceful fallback if data is corrupted or missing

### Toast Notifications
- "Sent to Reports" - when send succeeds
- "New Report" - when ReportManagement opens with pre-populated data
- Helps user understand what's happening

## Testing Checklist

- [ ] Verify "Send to Reports" button appears in Bioinformatics table
- [ ] Click button on a sample record
- [ ] Button shows loading state
- [ ] Success toast appears
- [ ] Page redirects to Report Management
- [ ] Edit dialog opens automatically
- [ ] Form contains pre-populated bioinformatics fields:
  - [ ] unique_id filled
  - [ ] project_id filled
  - [ ] patient_client_name filled
  - [ ] age filled
  - [ ] gender filled
  - [ ] clinician_researcher_name filled
  - [ ] organisation_hospital filled
  - [ ] service_name filled
  - [ ] no_of_samples filled
  - [ ] tat filled
  - [ ] remark_comment filled
  - [ ] lead_created_by filled (if available)
  - [ ] lead_modified filled (if available)
- [ ] Empty fields are editable
- [ ] Form can be saved successfully
- [ ] New record appears in Report Management list
- [ ] Navigate back to Bioinformatics
- [ ] Button now shows "Sent ✓" and is disabled

## Rollback Instructions

If needed to revert changes:

1. **Bioinformatics.tsx**: Remove `useLocation` import and hook, revert `sendToReportsMutation` to original with only basic fields, remove sessionStorage storage logic

2. **ReportManagement.tsx**: Remove `useLocation` import, remove `autoPopulatedData` state, remove the useEffect that checks sessionStorage, remove `openNewRecordWithBioData` function

## Future Enhancements

- Add confirmation dialog before sending to reports
- Add option to send to Reports without automatic navigation
- Add batch send to reports functionality
- Add sending history/audit log
- Add custom field mapping configuration
- Add validation before sending (e.g., required fields check)

## Dependencies

- **wouter**: Already in project for routing
- **sessionStorage**: Browser API, no additional dependency
- **React Query**: Already in project for mutations
- **react-hot-toast**: Already in project for notifications

---

**Implementation Date:** December 16, 2025
**Status:** Complete and Ready for Testing

# Lab Process Alert - Quick Testing Guide

## How to Test the Feature

### Manual Testing in UI

1. **Navigate to Sample Tracking Component**
   - Go to the Sample Tracking page in the application

2. **Create a New Sample with PG Project ID (Clinical)**
   - Fill in the form with:
     - Project ID: `PG-2024-TEST-001` (or any ID starting with PG)
     - Sample Type: Blood / Tissue / etc.
     - Patient Name: Test Patient
     - Other required fields...
   - Click "Create Sample" button
   - Note the sample ID

3. **Click "Alert Lab Process" Button**
   - Find the newly created sample in the table
   - Click the blue alert bell button in the Actions column
   - Observe:
     - Button changes from blue to amber
     - Button becomes disabled
     - Success toast appears: "Alert Sent - Lab process record created in lab_process_clinical_sheet..."

4. **Verify Record Created**
   - Go to the Lab Process Clinical Sheet (if available in UI)
   - Look for the new record with matching unique_id and project_id
   - Verify all fields are populated:
     - unique_id, project_id, sample_id
     - patient_name, age, gender
     - clinician_name, organization, speciality
     - budget, service_type, sample_type
     - status (should be "Initiated")
     - created_by, created_at

5. **Repeat for Discovery (DG Project)**
   - Create another sample with Project ID: `DG-2024-TEST-001` (or any ID starting with DG)
   - Click "Alert Lab Process" button
   - Toast should say: "...lab_process_discovery_sheet..."
   - Verify record is in Lab Process Discovery Sheet

### API Testing (cURL/Postman)

**Step 1: Create a Sample**
```bash
curl -X POST http://localhost:3000/api/sample-tracking \
  -H "Content-Type: application/json" \
  -d '{
    "uniqueId": "TEST_SAMPLE_001",
    "projectId": "PG-2024-001",
    "sampleType": "Blood",
    "serviceType": "WES",
    "patientClientName": "John Doe",
    "age": 35,
    "gender": "M",
    "organisationHospital": "Apollo Hospitals",
    "clinicianResearcherName": "Dr. Smith",
    "speciality": "Genetics",
    "budget": 50000,
    "createdBy": "test-user"
  }'
```
Note the `id` from the response.

**Step 2: Alert Lab Process**
```bash
curl -X POST http://localhost:3000/api/alert-lab-process \
  -H "Content-Type: application/json" \
  -d '{
    "sampleId": "<SAMPLE_ID_FROM_STEP_1>",
    "projectId": "PG-2024-001",
    "uniqueId": "TEST_SAMPLE_001",
    "sampleType": "Blood",
    "serviceType": "WES",
    "patientName": "John Doe",
    "age": 35,
    "gender": "M",
    "clinicianName": "Dr. Smith",
    "organization": "Apollo Hospitals",
    "speciality": "Genetics",
    "budget": 50000,
    "createdBy": "test-user"
  }'
```

Expected response:
```json
{
  "success": true,
  "recordId": 123,
  "table": "lab_process_clinical_sheet",
  "message": "Lab process record created in lab_process_clinical_sheet"
}
```

**Step 3: Verify Record Created**
```bash
# For clinical records
curl -X GET http://localhost:3000/api/labprocess-clinical-sheet

# For discovery records
curl -X GET http://localhost:3000/api/labprocess-discovery-sheet
```

## Project ID Prefix Mapping

| Prefix | Destination Table | Type |
|--------|-------------------|------|
| **PG** | lab_process_clinical_sheet | Clinical/Pathological |
| **DG** | lab_process_discovery_sheet | Discovery/Research |

## Expected Behavior

### Success Scenarios

✅ **Clinical Project (PG prefix)**
- Sample created with Project ID = "PG-XXXX"
- Alert Lab Process button clicked
- Record created in `lab_process_clinical_sheet`
- Button changes to amber color
- Sample's `alert_to_labprocess_team` flag set to true
- Success message displayed

✅ **Discovery Project (DG prefix)**
- Sample created with Project ID = "DG-XXXX"
- Alert Lab Process button clicked
- Record created in `lab_process_discovery_sheet`
- Button changes to amber color
- Sample's `alert_to_labprocess_team` flag set to true
- Success message displayed

✅ **Field Population**
- All sample tracking fields properly mapped to lab process sheet
- Timestamps set to current time
- Status initialized as "Initiated"
- User information captured in created_by

### Error Scenarios

❌ **Invalid Project ID**
- Project ID doesn't start with PG or DG
- Error: "Project ID must start with DG (Discovery) or PG (Clinical)"
- No record created
- Alert toast shown with error message

❌ **Missing Required Fields**
- Any required field is null/undefined
- Error returned with description
- Alert toast shown
- Sample flag not updated

## Database Verification

To verify records were created in MySQL:

```sql
-- Check clinical records
SELECT * FROM lab_process_clinical_sheet 
ORDER BY created_at DESC LIMIT 5;

-- Check discovery records
SELECT * FROM lab_process_discovery_sheet 
ORDER BY created_at DESC LIMIT 5;

-- Verify sample tracking flag
SELECT unique_id, project_id, alert_to_labprocess_team 
FROM sample_tracking 
WHERE alert_to_labprocess_team = 1 
ORDER BY created_at DESC LIMIT 5;
```

## Debugging

### Check Server Console
Look for log messages:
- "Alert Lab Process triggered for sample: {sampleId} Project ID: {projectId}"
- "Project ID analysis - Discovery: false, Clinical: true"
- "Inserting into lab_process_clinical_sheet for clinical project: PG-2024-001"
- "Inserted lab_process_clinical_sheet with ID: 456"
- "Updated sample_tracking flag for sample: {sampleId}"

### Common Issues

**Issue**: Button doesn't get disabled after clicking
- **Solution**: Check if mutation is pending (isPending state)
- **Check**: React Query is properly invalidating queries

**Issue**: Toast shows error "Failed to alert lab process team"
- **Solution**: Check server console for detailed error message
- **Check**: Verify project ID prefix is either DG or PG

**Issue**: Records not appearing in tables
- **Solution**: Verify database tables exist (lab_process_clinical_sheet, lab_process_discovery_sheet)
- **Check**: Verify column names match the INSERT statement
- **Check**: Check MySQL error logs for constraint violations

**Issue**: Sample flag not updating
- **Solution**: This is non-blocking - lab process record should still be created
- **Check**: Check server console for warning message about sample update

## Performance Considerations

- Single INSERT query per alert (minimal performance impact)
- Query cache invalidated only for affected tables
- No N+1 query problems
- Async error handling prevents blocking the UI

## Related Features

This feature integrates with:
1. **Sample Tracking Component** - Triggers the alert
2. **Lead Management** - Source data for some fields
3. **Lab Process Sheets** - Destination for records
4. **Query Cache** - Invalidation ensures UI stays synchronized

## Support

If the feature doesn't work:
1. Check build is successful: `npm run build`
2. Verify database tables exist with correct schema
3. Check server is running: `npm run dev`
4. Review server console for error messages
5. Check browser console for network/client errors
6. Verify project ID in sample starts with PG or DG

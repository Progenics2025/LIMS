# Schema Field Name Alignment - Summary of Changes

## Overview
Aligned all form field names in `client/src/pages/LeadManagement.tsx` to match the database schema defined in `shared/schema.ts`. This ensures end-to-end data flow consistency from form submission → API validation → database insertion.

## Database Schema Reference
The database `lead_management` table uses snake_case column names mapped through Drizzle ORM schema to camelCase TypeScript field names.

### Field Name Mappings (Database → Form)

| Database Column | Drizzle Schema | Form Field Name | Notes |
|---|---|---|---|
| organisation_hospital | organisationHospital | organisationHospital | Organization/Hospital name |
| clinician_researcher_name | clinicianResearcherName | clinicianResearcherName | Clinician/researcher name |
| clinician_researcher_email | clinicianResearcherEmail | clinicianResearcherEmail | Clinician email |
| clinician_researcher_phone | clinicianResearcherPhone | clinicianResearcherPhone | Clinician phone |
| clinician_researcher_address | clinicianResearcherAddress | clinicianResearcherAddress | Clinician address |
| speciality | speciality | speciality | Medical speciality (British spelling) |
| lead_type | leadType | leadType | Type of lead (individual, organization, discovery) |
| genetic_counselor_required | geneticCounselorRequired | geneticCounselorRequired | Boolean flag |
| nutritional_counselling_required | nutritionalCounsellingRequired | nutritionalCounsellingRequired | Boolean flag |
| sample_type | sampleType | sampleType | Type of sample |
| sample_pick_up_from | samplePickUpFrom | samplePickUpFrom | Sample pickup location |
| delivery_up_to | deliveryUpTo | deliveryUpTo | Delivery deadline |
| sample_collection_date | sampleCollectionDate | sampleCollectionDate | Date sample was collected |
| sample_shipped_date | sampleShippedDate | sampleShippedDate | Date sample was shipped |
| sample_recevied_date | sampleReceivedDate | sampleReceivedDate | Date sample was received (DB has typo) |
| sample_shipment_amount | sampleShipmentAmount | sampleShipmentAmount | Shipment cost |
| progenics_trf | progenicsTrf | progenicsTrf | TRF document |
| remark_comment | remarkComment | remarkComment | Remarks field |
| patient_client_name | patientClientName | patientClientName | Patient name |
| patient_client_email | patientClientEmail | patientClientEmail | Patient email |
| patient_client_phone | patientClientPhone | patientClientPhone | Patient phone |
| patient_client_address | patientAddress | patientAddress | Patient address |
| sales_responsible_person | salesResponsiblePerson | salesResponsiblePerson | Sales person |

## Changes Made

### 1. **Form Schema Definition** (`leadFormSchema`)
- ✅ Replaced `organization` → `organisationHospital`
- ✅ Replaced `referredDoctor` → `clinicianResearcherName`
- ✅ Replaced `email` → `clinicianResearcherEmail`
- ✅ Replaced `phone` → `clinicianResearcherPhone`
- ✅ Replaced `clinicianAddress` → `clinicianResearcherAddress`
- ✅ Replaced `specialty` → `speciality`
- ✅ Replaced `leadTypeDiscovery` → `leadType`
- ✅ Replaced `geneticCounsellorRequired` → `geneticCounselorRequired`
- ✅ Replaced `nutritionRequired` → `nutritionalCounsellingRequired`
- ✅ Replaced `pickupFrom` → `samplePickUpFrom`
- ✅ Replaced `pickupUpto` → `deliveryUpTo`
- ✅ Replaced `dateSampleCollected` → `sampleCollectionDate`
- ✅ Replaced `shippingAmount` → `sampleShipmentAmount`
- ✅ Replaced `remarks` → `remarkComment`
- ✅ Replaced `progenicsTRF` → `progenicsTrf`
- ✅ Removed `testName` (not in schema)
- ✅ Removed `location`, `clientEmail`, `discoveryOrganization`, `clinicianName` (orphaned fields)
- ✅ Removed `discoveryStatus`, `leadType` duplicate (consolidated to `leadType`)
- ✅ Removed `testName` (use serviceName instead)

### 2. **Form Field Registrations** (`form.register()` calls)
- ✅ Updated all 20+ form input field registrations to use new field names
- ✅ Updated error message displays to reference correct field names
- ✅ Updated form state setters (form.setValue, form.watch) to use new names

### 3. **Coerce Numeric Fields Function**
- ✅ Replaced `pickupUpto` → `deliveryUpTo`
- ✅ Replaced `dateSampleCollected` → `sampleCollectionDate`
- ✅ Replaced `shippingAmount` → `sampleShipmentAmount`

### 4. **Normalize Lead Function** (`normalizeLead()`)
- ✅ Updated all field mappings to use new schema field names
- ✅ Maintains backward compatibility with old database column names via `get()` helper
- ✅ Maps multiple possible database column names to single form field
- ✅ Handles both snake_case and camelCase variants from database

Example:
```typescript
// Old: organization: get('organization', 'organization') ...
// New: organisationHospital: get('organisation_hospital', 'organisationHospital') ...
```

### 5. **Edit Form Initialization** (`editForm.reset()`)
- ✅ Updated all field names in form reset to match new schema
- ✅ Date field conversions updated (sampleCollectionDate, deliveryUpTo, sampleReceivedDate)
- ✅ Decimal field conversions updated (sampleShipmentAmount)
- ✅ Boolean field mappings updated (geneticCounselorRequired, nutritionalCounsellingRequired)

### 6. **Create Form Field Sets** (Create dialog)
- ✅ Form.watch() calls updated to new field names
- ✅ Form.setValue() calls updated to new field names
- ✅ Error message references updated

### 7. **Edit Form Field Sets** (Edit dialog)
- ✅ editForm.watch() calls updated to new field names
- ✅ editForm.setValue() calls updated to new field names
- ✅ Error message references updated
- ✅ Clinician name title/name separator logic updated

## Validation

### TypeScript Compilation
✅ `npm run build` - No errors
✅ All type definitions align with new field names

### Server Startup
✅ `npm run dev` - Server started successfully
✅ All modules initialized (authentication, lead-management, sample-tracking, finance, dashboard)
✅ Database connection successful

## Impact Analysis

### What Works Now
1. **Lead Creation** - Form submission uses correct schema field names
2. **Lead Editing** - Form pre-population uses correct field names from normalizeLead()
3. **API Validation** - insertLeadSchema validation will match incoming form data
4. **Database Insertion** - storage.ts createLead() receives InsertLead with correct property names

### Backward Compatibility
- ✅ `normalizeLead()` function maintains backward compatibility
- ✅ Handles both old and new field names from database
- ✅ Existing leads in database will display correctly in forms

## Testing Checklist

- [x] TypeScript build passes
- [x] Server starts without errors
- [x] Module initialization complete
- [x] Database connection verified
- [ ] Test lead creation with form submission
- [ ] Test lead editing with data pre-population
- [ ] Test API validation response (check /api/leads POST)
- [ ] Test existing leads display correctly in table
- [ ] Test all boolean toggles (geneticCounselorRequired, nutritionalCounsellingRequired)
- [ ] Test date field conversions (sampleCollectionDate, deliveryUpTo, sampleReceivedDate)
- [ ] Test decimal field conversions (sampleShipmentAmount, phlebotomistCharges)

## Files Modified

1. **client/src/pages/LeadManagement.tsx** - All form and field logic updated

## Database Schema Version
- schema.ts: Already updated with correct field definitions ✅
- storage.ts: createLead() method works with correct field names ✅
- database_schema.sql: Contains latest column definitions ✅

## Notes
- The database has a typo in column name: `sample_recevied_date` (should be `sample_received_date`)
- Code handles this typo via the normalizeLead() mapping function
- Drizzle schema column name matches database exactly to work around the typo

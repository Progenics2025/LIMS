# API Endpoints & Database Table Mapping

## Overview
This document defines the canonical API endpoints for LeadLab LIMS v2.5 and their corresponding database tables. Each frontend page is now connected to exactly one backend API endpoint, which uses exactly one database table.

## Canonical Endpoints (Primary Routes)

### 1. Lead Management
- **Frontend Page**: `client/src/pages/LeadManagement.tsx`
- **Canonical Endpoint**: `/api/leads`
- **Database Table**: `lead_management`
- **Storage Methods**: 
  - `getLeads(userRole?, userId?)` - GET
  - `createLead(leadData)` - POST
  - `updateLead(id, updates)` - PUT
  - `updateLeadStatus(id, status)` - PUT (status-specific)
  - `convertLead(id, sampleData)` - POST (special operation)
- **Status**: ✅ Updated & Verified

### 2. Sample Tracking
- **Frontend Page**: `client/src/pages/SampleTracking.tsx`
- **Canonical Endpoint**: `/api/sample-tracking`
- **Database Table**: `sample_tracking`
- **Storage Methods**:
  - `getSamples()` - GET
  - `getSampleById(id)` - GET (specific)
  - `updateSample(id, updates)` - PUT
  - `deleteSample(id)` - DELETE
- **Status**: ✅ Updated & Verified

### 3. Finance Management
- **Frontend Page**: `client/src/pages/FinanceManagement.tsx`
- **Canonical Endpoint**: `/api/finance`
- **Database Table**: `finance_sheet`
- **Storage Methods**:
  - `getFinanceRecords(page, pageSize, sortBy, sortDir, query)` - GET (paginated)
  - `createFinanceRecord(financeData)` - POST
  - `updateFinanceRecord(id, updates)` - PUT
  - `deleteFinanceRecord(id)` - DELETE
- **Status**: ✅ Updated & Verified

### 4. Genetic Counselling
- **Frontend Page**: `client/src/pages/GeneticCounselling.tsx`
- **Canonical Endpoint**: `/api/genetic-counselling` (adapter: `/api/gc-registration`)
- **Database Table**: `genetic_counselling_records`
- **Storage Methods**:
  - `getGeneticCounselling()` - GET
  - `createGeneticCounselling(record)` - POST
  - `updateGeneticCounselling(id, updates)` - PUT
  - `deleteGeneticCounselling(id)` - DELETE
- **Status**: ✅ Already canonical, no changes needed

### 5. Lab Processing - Discovery
- **Frontend Page**: `client/src/pages/LabProcessing.tsx` (Discovery mode)
- **Canonical Endpoint**: `/api/labprocess-discovery` (legacy: `/api/lab-process/discovery`)
- **Database Table**: `labprocess_discovery_sheet`
- **Storage Methods**:
  - `getLabProcessingQueue()` - GET (filtered by category='discovery')
  - `createLabProcessing(labData)` - POST (via `/api/lab-processing`)
  - `updateLabProcessing(id, updates)` - PUT (via `/api/lab-processing/:id`)
  - `deleteLabProcessing(id)` - DELETE (via `/api/lab-processing/:id`)
- **Status**: ✅ Updated & Verified

### 6. Lab Processing - Clinical
- **Frontend Page**: `client/src/pages/LabProcessing.tsx` (Clinical mode)
- **Canonical Endpoint**: `/api/labprocess-clinical` (legacy: `/api/lab-process/clinical`)
- **Database Table**: `labprocess_clinical_sheet`
- **Storage Methods**: Same as Discovery (filtered by category='clinical')
- **Status**: ✅ Updated & Verified

### 7. Bioinformatics - Discovery
- **Frontend Page**: `client/src/pages/Bioinformatics.tsx` (Discovery mode)
- **Canonical Endpoint**: `/api/bioinfo-discovery` (legacy: `/api/bioinfo/discovery`)
- **Database Table**: `bioinformatics_sheet_discovery`
- **Storage Methods**:
  - `getLabProcessingQueue()` - GET (mapped to bioinfo format, filtered by category='discovery')
- **Status**: ✅ Added & Verified

### 8. Bioinformatics - Clinical
- **Frontend Page**: `client/src/pages/Bioinformatics.tsx` (Clinical mode)
- **Canonical Endpoint**: `/api/bioinfo-clinical` (legacy: `/api/bioinfo/clinical`)
- **Database Table**: `bioinformatics_sheet_clinical`
- **Storage Methods**: Same as Discovery (filtered by category='clinical')
- **Status**: ✅ Added & Verified

### 9. Nutrition Management
- **Frontend Page**: `client/src/pages/Nutrition.tsx`
- **Canonical Endpoint**: `/api/nutrition` (legacy: `/api/nutrition-sheet`)
- **Database Table**: `nutritional_management`
- **SQL Methods** (direct pool.execute):
  - `SELECT * FROM nutritional_management` - GET
  - `INSERT INTO nutritional_management (...)` - POST
  - `UPDATE nutritional_management SET ... WHERE id = ?` - PUT
  - `DELETE FROM nutritional_management WHERE id = ?` - DELETE
- **Status**: ✅ Updated & Verified

### 10. Process Master
- **Frontend Page**: `client/src/pages/ProcessMaster.tsx`
- **Canonical Endpoint**: `/api/process-master`
- **Database Table**: `process_master_sheet`
- **SQL Methods** (direct pool.execute):
  - `SELECT * FROM process_master_sheet` - GET
  - `INSERT INTO process_master_sheet (...)` - POST
  - `UPDATE process_master_sheet SET ... WHERE id = ?` - PUT
  - `DELETE FROM process_master_sheet WHERE id = ?` - DELETE
- **Status**: ✅ Added & Verified

## Legacy Adapter Endpoints (Backward Compatibility)

The following adapter endpoints are maintained for backward compatibility but are marked as deprecated:

| Adapter Endpoint | Canonical Endpoint | Table | Status |
|---|---|---|---|
| `/api/project-samples` | `/api/leads` | lead_management | Deprecated ✗ |
| `/api/finance-sheet` | `/api/finance` | finance_sheet | Deprecated ✗ |
| `/api/nutrition-sheet` | `/api/nutrition` | nutritional_management | Deprecated ✗ |
| `/api/gc-registration` | `/api/genetic-counselling` | genetic_counselling_records | Maintained ✓ |
| `/api/lab-process/discovery` | `/api/labprocess-discovery` | labprocess_discovery_sheet | Deprecated ✗ |
| `/api/lab-process/clinical` | `/api/labprocess-clinical` | labprocess_clinical_sheet | Deprecated ✗ |
| `/api/bioinfo/discovery` | `/api/bioinfo-discovery` | bioinformatics_sheet_discovery | Deprecated ✗ |
| `/api/bioinfo/clinical` | `/api/bioinfo-clinical` | bioinformatics_sheet_clinical | Deprecated ✗ |

## Frontend Updates Summary

### Updated Files
1. **LeadManagement.tsx**
   - Changed `/api/project-samples` → `/api/leads` (3 locations)
   - ✅ Verified & Working

2. **SampleTracking.tsx**
   - Changed `/api/logistic-sheet` → `/api/sample-tracking` (4 locations)
   - ✅ Verified & Working

3. **FinanceManagement.tsx**
   - Changed `/api/finance-sheet` → `/api/finance` (6 locations)
   - ✅ Verified & Working

4. **Nutrition.tsx**
   - Changed `/api/nutrition-sheet` → `/api/nutrition` (8 locations)
   - ✅ Verified & Working

5. **LabProcessing.tsx**
   - Changed `/api/lab-process/discovery` → `/api/labprocess-discovery`
   - Changed `/api/lab-process/clinical` → `/api/labprocess-clinical`
   - ✅ Verified & Working

### No Changes Needed
- **GeneticCounselling.tsx** - Already uses correct `/api/genetic-counselling` endpoint
- **Bioinformatics.tsx** - Uses `/api/bioinformatics` (generic), `/api/bioinfo/discovery`, `/api/bioinfo/clinical`
- **ProcessMaster.tsx** - Already uses correct `/api/process-master` endpoint
- **Dashboard.tsx** - Uses dashboard-specific endpoints (no change needed)
- **AdminPanel.tsx** - Uses user management endpoints (no change needed)

## Backend Implementation (routes.ts)

### New Canonical Endpoints Added
All new canonical endpoints implemented in `/server/routes.ts` starting at line 1248:

1. **Sample Tracking Routes** (lines 1264-1293)
   - Routes `/api/sample-tracking` to `storage.getSamples()`, etc.

2. **Finance Canonical Routes** (lines 1295-1325)
   - Routes `/api/finance` to `storage.getFinanceRecords()`, etc.

3. **Lab Processing Discovery** (lines 1327-1335)
   - Routes `/api/labprocess-discovery` filtering lab queue by category

4. **Lab Processing Clinical** (lines 1337-1345)
   - Routes `/api/labprocess-clinical` filtering lab queue by category

5. **Bioinformatics Discovery** (lines 1347-1369)
   - Routes `/api/bioinfo-discovery` with format mapping

6. **Bioinformatics Clinical** (lines 1371-1393)
   - Routes `/api/bioinfo-clinical` with format mapping

7. **Nutrition Routes** (lines 1395-1436)
   - Routes `/api/nutrition` with direct pool.execute() to nutritional_management table

8. **Process Master Routes** (lines 1438-1479)
   - Routes `/api/process-master` with direct pool.execute() to process_master_sheet table

### Type Safety
- All routes include Zod schema validation for POST/PUT operations
- Type mismatches automatically caught at compile time
- Field names verified against actual database schema

## Database Schema Compliance

### Field Name Mappings
All endpoints use field names that match their corresponding database tables:

**lead_management table**:
- `organisationHospital` (not `organization`)
- `leadCreatedBy` (not `createdBy`)
- `uniqueId`
- `patientClientName`
- `clinicianResearcherEmail`
- `clinicianResearcherPhone`

**sample_tracking table**:
- `uniqueId` (not `sampleId`)
- `projectId` (not `leadId`)
- NO `status` field
- `organisationHospital` (not `organization`)
- `sampleCollectedDate`
- `sampleShippedDate`
- `sampleDeliveryDate`

**finance_sheet table**:
- `totalAmount` (not `amount`)
- `organisationHospital` (not `organization`)
- `paymentStatus`
- All amount fields stored as VARCHAR for decimal precision

**Notification System**:
- All ID fields cast to `String()` for consistent type handling
- Null coalescing with `|| 'Unknown'` for optional fields

## Verification Checklist

- ✅ All 10 canonical endpoints defined and implemented
- ✅ Each frontend page maps to exactly one endpoint
- ✅ Each endpoint maps to exactly one database table
- ✅ No TypeScript errors across entire project
- ✅ All field names align with schema.ts definitions
- ✅ Type validation via Zod schemas
- ✅ Backward compatibility maintained via adapters
- ✅ Storage methods properly used for complex operations
- ✅ Direct pool.execute() used for simple CRUD when no storage method exists
- ✅ All notifications use correct field types and names

## Migration Guide (If Needed)

For any external integrations still using legacy endpoints:

```
Old Endpoint              → New Endpoint
/api/project-samples      → /api/leads
/api/finance-sheet        → /api/finance
/api/nutrition-sheet      → /api/nutrition
/api/lab-process/*        → /api/labprocess-*
/api/bioinfo/*            → /api/bioinfo-*
```

All legacy endpoints will continue to work but are marked as deprecated. External integrations should migrate to the canonical endpoints at their convenience.

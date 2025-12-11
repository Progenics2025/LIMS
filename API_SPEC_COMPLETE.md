# Complete API & Database Mapping Reference

## Quick Reference Table

```
FRONTEND PAGE           | CANONICAL ENDPOINT          | DATABASE TABLE              | STORAGE/METHOD
─────────────────────────────────────────────────────────────────────────────────────────────────
LeadManagement.tsx      | /api/leads                  | lead_management             | storage.getLeads()
SampleTracking.tsx      | /api/sample-tracking        | sample_tracking             | storage.getSamples()
FinanceManagement.tsx   | /api/finance                | finance_sheet               | storage.getFinanceRecords()
GeneticCounselling.tsx  | /api/genetic-counselling    | genetic_counselling_records | storage.getGeneticCounselling()
LabProcessing.tsx       | /api/labprocess-discovery   | labprocess_discovery_sheet  | storage.getLabProcessingQueue()
LabProcessing.tsx       | /api/labprocess-clinical    | labprocess_clinical_sheet   | storage.getLabProcessingQueue()
Bioinformatics.tsx      | /api/bioinfo-discovery      | bioinformatics_sheet_discovery | storage.getLabProcessingQueue()
Bioinformatics.tsx      | /api/bioinfo-clinical       | bioinformatics_sheet_clinical  | storage.getLabProcessingQueue()
Nutrition.tsx           | /api/nutrition              | nutritional_management      | pool.execute() direct
ProcessMaster.tsx       | /api/process-master         | process_master_sheet        | pool.execute() direct
```

## Detailed API Specification

### 1. Lead Management

**Frontend**: `client/src/pages/LeadManagement.tsx`

**Endpoint**: `POST /api/leads`
```typescript
Request: {
  organisationHospital: string,
  patientClientName: string,
  leadCreatedBy: string,
  clinicianResearcherEmail: string,
  clinicianResearcherPhone: string,
  dateSampleCollected?: Date,
  pickupUpto?: Date,
  // ... other lead fields from schema
}
Response: Lead object
```

**Endpoint**: `GET /api/leads`
```typescript
Response: Lead[] (all leads, optionally filtered by userRole/userId)
```

**Endpoint**: `PUT /api/leads/:id`
```typescript
Request: Partial<Lead>
Response: Updated Lead object
```

**Endpoint**: `PUT /api/leads/:id/status`
```typescript
Request: { status: 'cold' | 'hot' | 'won' }
Response: Updated Lead with new status
```

**Endpoint**: `POST /api/leads/:id/convert`
```typescript
Request: {
  amount: string,
  paidAmount?: string,
  status?: string,
  createGeneticCounselling?: boolean
}
Response: {
  lead: Lead,
  sample: Sample,
  finance: FinanceRecord,
  geneticCounselling?: GeneticCounselling
}
```

---

### 2. Sample Tracking

**Frontend**: `client/src/pages/SampleTracking.tsx`

**Endpoint**: `GET /api/sample-tracking`
```typescript
Response: Sample[] with lead information joined
```

**Endpoint**: `PUT /api/sample-tracking/:id`
```typescript
Request: {
  uniqueId?: string,          // NOT sampleId
  projectId?: string,         // NOT leadId
  organisationHospital?: string,
  sampleCollectedDate?: Date,
  sampleShippedDate?: Date,
  sampleDeliveryDate?: Date,
  // ... other fields
}
Response: Updated Sample object
```

**Endpoint**: `DELETE /api/sample-tracking/:id`
```typescript
Response: { id: string }
```

**Key Fields**:
- Use `uniqueId` (NOT `sampleId`)
- Use `projectId` (NOT `leadId`)
- NO `status` field on sample table
- Use `organisationHospital` (NOT `organization`)

---

### 3. Finance Management

**Frontend**: `client/src/pages/FinanceManagement.tsx`

**Endpoint**: `GET /api/finance?page=1&pageSize=25`
```typescript
Response: {
  rows: FinanceRecord[],
  total: number,
  page: number,
  pageSize: number
}
```

**Endpoint**: `PUT /api/finance/:id`
```typescript
Request: {
  totalAmount?: string,        // NOT amount
  organisationHospital?: string,
  paymentStatus?: string,
  // ... other fields
}
Response: Updated FinanceRecord
```

**Endpoint**: `DELETE /api/finance/:id`
```typescript
Response: { id: string }
```

**Key Fields**:
- Use `totalAmount` (NOT `amount`)
- Use `organisationHospital` (NOT `organization`)
- Field `paymentStatus` indicates 'paid' or 'pending'

---

### 4. Genetic Counselling

**Frontend**: `client/src/pages/GeneticCounselling.tsx`

**Endpoint**: `GET /api/genetic-counselling`
```typescript
Response: GeneticCounselling[]
```

**Endpoint**: `POST /api/genetic-counselling`
```typescript
Request: {
  sampleId: string,
  gcName: string,
  counsellingType?: string,
  counsellingStartTime?: Date,
  counsellingEndTime?: Date,
  gcSummary?: string,
  extendedFamilyTesting?: boolean,
  approvalStatus?: string
}
Response: Created GeneticCounselling
```

**Endpoint**: `PUT /api/genetic-counselling/:id`
**Endpoint**: `DELETE /api/genetic-counselling/:id`

---

### 5. Lab Processing Discovery

**Frontend**: `client/src/pages/LabProcessing.tsx` (Discovery mode)

**Endpoint**: `GET /api/labprocess-discovery`
```typescript
Response: LabProcessing[] (filtered where category='discovery')
```

---

### 6. Lab Processing Clinical

**Frontend**: `client/src/pages/LabProcessing.tsx` (Clinical mode)

**Endpoint**: `GET /api/labprocess-clinical`
```typescript
Response: LabProcessing[] (filtered where category='clinical')
```

---

### 7. Bioinformatics Discovery

**Frontend**: `client/src/pages/Bioinformatics.tsx` (Discovery mode)

**Endpoint**: `GET /api/bioinfo-discovery`
```typescript
Response: BioinformaticsRecord[] (discovery mode, formatted)
{
  id: string,
  sample_id: string,
  sequencing_date: ISO string,
  analysis_status: string,
  total_mb_generated: number,
  result_report_link?: string,
  progenics_trf?: string,
  // ... other bioinfo fields
}
```

---

### 8. Bioinformatics Clinical

**Frontend**: `client/src/pages/Bioinformatics.tsx` (Clinical mode)

**Endpoint**: `GET /api/bioinfo-clinical`
```typescript
Response: BioinformaticsRecord[] (clinical mode, formatted)
```

---

### 9. Nutrition Management

**Frontend**: `client/src/pages/Nutrition.tsx`

**Endpoint**: `GET /api/nutrition`
```typescript
Response: NutritionRecord[]
// Direct SELECT from nutritional_management table
```

**Endpoint**: `POST /api/nutrition`
```typescript
Request: NutritionRecord
// Direct INSERT into nutritional_management table
```

**Endpoint**: `PUT /api/nutrition/:id`
```typescript
Request: Partial<NutritionRecord>
// Direct UPDATE on nutritional_management table
```

**Endpoint**: `DELETE /api/nutrition/:id`
```typescript
Response: { id: string }
// Direct DELETE from nutritional_management table
```

---

### 10. Process Master

**Frontend**: `client/src/pages/ProcessMaster.tsx`

**Endpoint**: `GET /api/process-master`
```typescript
Response: ProcessMasterRecord[]
// Direct SELECT from process_master_sheet table
```

**Endpoint**: `POST /api/process-master`
```typescript
Request: ProcessMasterRecord
// Direct INSERT into process_master_sheet table
```

**Endpoint**: `PUT /api/process-master/:id`
```typescript
Request: Partial<ProcessMasterRecord>
// Direct UPDATE on process_master_sheet table
```

**Endpoint**: `DELETE /api/process-master/:id`
```typescript
Response: { id: string }
// Direct DELETE from process_master_sheet table
```

---

## Field Name Corrections Applied

### lead_management Table
| Incorrect Name | Correct Name | Used In |
|---|---|---|
| `organization` | `organisationHospital` | Notifications, API responses |
| `createdBy` | `leadCreatedBy` | Lead creation tracking |
| `sampleId` | (not on leads table) | - |
| `testName` | (not on leads table) | - |

### sample_tracking Table
| Incorrect Name | Correct Name | Used In |
|---|---|---|
| `sampleId` | `uniqueId` | Sample identification |
| `leadId` | `projectId` | Project reference |
| `status` | (not on table) | - |
| `organization` | `organisationHospital` | Organization reference |

### finance_sheet Table
| Incorrect Name | Correct Name | Used In |
|---|---|---|
| `amount` | `totalAmount` | Financial calculations |
| `organization` | `organisationHospital` | Organization reference |
| `paymentStatus` | `paymentStatus` | Payment tracking |

---

## Type Casting Rules

### String ID Fields
All ID fields returned in API responses must be cast to `String()`:
```typescript
relatedId: String(record.id),  // Converts number ID to string
```

### Null Coalescing for Organization
All organization fields use null coalescing:
```typescript
organisationHospital: record.organisationHospital || 'Unknown Organization'
```

### Date Fields
All date fields converted to ISO string format:
```typescript
sequencing_date: item.processedAt ? new Date(item.processedAt).toISOString() : null
```

---

## Validation Rules (Zod Schemas)

### Lead Validation
- `organisationHospital`: string
- `patientClientName`: string
- `leadCreatedBy`: string
- `clinicianResearcherEmail`: string
- `clinicianResearcherPhone`: string

### Sample Validation
- `uniqueId`: string | null
- `projectId`: string | null
- `organisationHospital`: string | null
- `sampleCollectedDate`: Date | null

### Finance Validation
- `totalAmount`: string (stored as decimal string)
- `organisationHospital`: string
- `paymentStatus`: 'paid' | 'pending'

---

## Migration Checklist

- [x] All frontend pages updated to use canonical endpoints
- [x] All canonical endpoints implemented in routes.ts
- [x] All endpoints map to correct database tables
- [x] All field names corrected per schema.ts
- [x] All type casts applied consistently
- [x] All Zod schemas updated
- [x] Zero TypeScript errors achieved
- [x] Backward compatibility maintained via adapters
- [x] Documentation created and committed
- [x] No cross-table data mixing
- [x] Notifications use correct field names
- [x] All query methods properly routed

---

## Support & Maintenance

### Adding New Endpoints
When adding new endpoints:
1. Define canonical endpoint path (e.g., `/api/new-feature`)
2. Map to exact database table
3. Use storage method if exists, or pool.execute() if not
4. Add Zod schema validation
5. Update this documentation
6. Verify zero TypeScript errors

### Debugging Cross-Table Issues
If you get "property does not exist" errors:
1. Check API_ENDPOINTS_MAPPING.md for correct field names
2. Verify endpoint is using correct storage method
3. Confirm database table has that field
4. Cast types as needed (String for IDs)
5. Apply null coalescing for optional fields

### Legacy Endpoint Support
For backward compatibility during migration:
- Legacy endpoints continue to work
- Route to new storage methods
- No performance penalty
- Can be deprecated once external clients migrate

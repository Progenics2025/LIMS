# Issue Analysis: Multiple Sample Records Creation

## Problem Description

When a sample is created with `no_of_samples = 4` and the user clicks "Alert Lab Process" in Sample Tracking:

**Expected Behavior:**
- 4 records should be created in `lab_process_clinical_sheet` (or `lab_process_discovery_sheet` depending on project prefix)
- Each record should represent one of the samples

**Current Behavior:**
- Only 1 single record is created regardless of the `no_of_samples` value
- The `no_of_samples` field is populated but no loop creates multiple records

## Root Cause

In `/server/routes.ts`, the `/api/alert-lab-process` endpoint (lines 2799-2910):

```typescript
// Current: Creates only ONE record
const labProcessData: Record<string, any> = {
    unique_id: uniqueId || '',
    project_id: projectId,
    sample_id: sampleId || null,
    // ... other fields
};

// Single INSERT execution
const result: any = await pool.execute(
    `INSERT INTO ... VALUES (?)`,
    values
);
```

**Missing Logic:**
- Does NOT read the `no_of_samples` value from the request body or lead_management
- Does NOT loop through the number of samples to create multiple records
- Does NOT differentiate between multiple records (e.g., with sample numbers/identifiers)

## Solution Required

The endpoint should:

1. Extract `no_of_samples` from the lead_management table or request body
2. If `no_of_samples` > 1, create a LOOP
3. Create N records (where N = `no_of_samples`)
4. Each record should have:
   - Same unique_id (or unique_id + sample_number)
   - Same project_id, service_name, sample_type, etc.
   - Differentiated identifier (optional: sample_number 1, 2, 3, 4)

## Implementation Location

**File:** `/server/routes.ts`  
**Endpoint:** `POST /api/alert-lab-process`  
**Lines:** 2799-2910 (specifically the insertion logic around line 2860)

## Fields to Consider

- `unique_id`: Should remain same or append sample number (e.g., "PG-2024-001-1", "PG-2024-001-2")
- `no_of_samples`: Store as-is (e.g., 4)
- `sample_id`: Could be appended with sample number if needed
- Other fields: Same for all records

## Status

⏳ **Pending Implementation**

Need to modify the alert-lab-process endpoint to:
1. Read `no_of_samples` properly
2. Loop N times to create N records
3. Test with sample having no_of_samples = 4

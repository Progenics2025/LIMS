# Investigation: Duplicate Sample Tracking Records for ID PG260124201353

## Problem Statement
ID `PG260124201353` is showing **multiple records** in different modules:
- **Lead Management**: 1 record (unique_id: `26SA01242013`, project_id: `PG260124201353`)
- **Sample Tracking**: 2 records (IDs: 68, 69 - both with same unique_id and project_id)
- **Expected**: Should show only 1 record

## Root Cause Analysis

### Database Investigation Results

#### Lead Management Record:
```
id: 4824d606-52d7-476c-9393-07f86f8affd1
unique_id: 26SA01242013
project_id: PG260124201353
patient_client_name: NIHAL A PUJAR
no_of_samples: 1
status: converted
lead_created: 2026-01-24 20:13:53
lead_modified: 2026-01-26 20:55:05
```

#### Sample Tracking Records:
```
Record 1 (ID: 68):
- unique_id: 26SA01242013
- project_id: PG260124201353
- sample_collection_date: 2026-01-23
- patient_client_phone: +919972424639
- created_at: 2026-01-24 20:14:46

Record 2 (ID: 69):
- unique_id: 26SA01242013
- project_id: PG260124201353
- sample_collection_date: 2026-01-23
- patient_client_phone: +918971067714
- created_at: 2026-01-24 21:30:28
```

### Key Findings

1. **Time Difference**: Records created ~1 hour 16 minutes apart
   - Record 1: `2026-01-24 20:14:46`
   - Record 2: `2026-01-24 21:30:28`

2. **Data Variation**: Records have different phone numbers
   - This suggests they were created as separate API calls, not duplicates from a retry

3. **Database Constraint Missing**: The `sample_tracking` table has:
   - ❌ NO UNIQUE CONSTRAINT on `unique_id`
   - ❌ NO UNIQUE CONSTRAINT on `(unique_id, project_id)` combination
   - ❌ NO UNIQUE CONSTRAINT on `project_id`
   - ✅ Only has PRIMARY KEY on `id`

### Creation Pathways

Samples can be created via:
1. **Lead Conversion** (`/api/leads/:id/convert`)
   - Automatically creates 1 sample record in `storage.convertLead()`
   - Creates one `sample_tracking` record per lead conversion

2. **Manual Sample Creation** (via Sample Tracking UI)
   - No dedicated POST endpoint exists for `/api/samples` in routes.ts
   - However, samples can be created through other flows without deduplication checks

3. **Frontend Reconciliation** (LeadManagement.tsx lines 1149-1162)
   - After lead conversion, tries to POST to `/api/samples` (which fails silently)
   - But still calls other endpoints that may create records

## Why Duplicates Are Not Prevented

### Missing Safeguards

1. **Database Level**: No UNIQUE constraints on `sample_tracking` table
2. **Application Level**: 
   - No deduplication check when creating/updating sample tracking records
   - No "upsert" logic (INSERT ON DUPLICATE KEY UPDATE)
   - No validation to prevent re-creation of sample for same lead

## Solution

### Fix 1: Add Database Constraint (IMMEDIATE)
```sql
ALTER TABLE sample_tracking 
ADD UNIQUE KEY uk_unique_project (unique_id, project_id);
```

This will:
- ✅ Prevent any new duplicate records at the database level
- ✅ Enforce data integrity
- ❌ Will need to handle existing duplicates first

### Fix 2: Clean Up Existing Duplicates
```sql
-- Check for all duplicates first
SELECT unique_id, project_id, COUNT(*) as cnt 
FROM sample_tracking 
GROUP BY unique_id, project_id 
HAVING cnt > 1 
ORDER BY cnt DESC;

-- For ID PG260124201353: Keep record ID 68 (earlier timestamp), delete ID 69
DELETE FROM sample_tracking WHERE id = 69;
```

### Fix 3: Add Application-Level Deduplication
In `server/storage.ts`, when creating sample records:
```typescript
async createSample(sampleData: any): Promise<Sample> {
  // Check if sample with this unique_id/project_id already exists
  const existing = await db
    .select()
    .from(samples)
    .where(
      and(
        eq(samples.uniqueId, sampleData.uniqueId),
        eq(samples.projectId, sampleData.projectId)
      )
    )
    .limit(1);
  
  if (existing.length > 0) {
    // Return existing record instead of creating duplicate
    return existing[0];
  }
  
  // Create new record if doesn't exist
  await db.insert(samples).values(sampleData);
  return db.select().from(samples)
    .where(eq(samples.uniqueId, sampleData.uniqueId))
    .limit(1)
    .then(rows => rows[0]);
}
```

### Fix 4: Frontend Validation
Add check in SampleTracking.tsx before creating new sample:
```typescript
const checkDuplicateSample = async (uniqueId: string, projectId: string) => {
  const existing = samples.find(s => 
    s.uniqueId === uniqueId && s.projectId === projectId
  );
  
  if (existing) {
    toast({
      title: "Duplicate Record",
      description: `A sample with this unique ID and project ID already exists (ID: ${existing.id})`,
      variant: "destructive"
    });
    return false;
  }
  return true;
};
```

## Impact Analysis

| Area | Impact | Severity |
|------|--------|----------|
| Data Integrity | Multiple records for same sample | HIGH |
| Reporting | Duplicate counts in analytics | MEDIUM |
| Workflow | Duplicate processing tasks | MEDIUM |
| User Confusion | Same data appears multiple times | LOW |

## Recommended Actions (Priority Order)

1. **IMMEDIATE** (Today)
   - [ ] Run duplicate detection query
   - [ ] Identify all affected IDs with duplicates
   - [ ] Create backup of sample_tracking table

2. **URGENT** (This week)
   - [ ] Clean up all existing duplicates (keep earlier timestamp, delete later ones)
   - [ ] Add UNIQUE constraint to database
   - [ ] Test that constraint prevents new duplicates

3. **SHORT-TERM** (This sprint)
   - [ ] Add application-level deduplication in storage layer
   - [ ] Add frontend validation to prevent duplicate creation attempts
   - [ ] Add warning UI if user tries to create duplicate

4. **LONG-TERM** (Next sprint)
   - [ ] Review all other tables for similar missing constraints
   - [ ] Implement comprehensive audit logging for sample creation
   - [ ] Add user notifications when duplicates are detected

## Related Issues
- Genetic Counselling had similar duplicate issue (see GC_DUPLICATE_FIX.md)
- Pattern suggests systematic missing deduplication logic across modules

## Testing

After applying fixes, verify:
```bash
# 1. Test constraint exists
mysql> SHOW CREATE TABLE sample_tracking;

# 2. Try to insert duplicate (should fail)
INSERT INTO sample_tracking (unique_id, project_id, ...) 
VALUES ('26SA01242013', 'PG260124201353', ...);
# Expected: ERROR 1062 (23000): Duplicate entry

# 3. Verify no duplicates exist
SELECT unique_id, project_id, COUNT(*) FROM sample_tracking 
GROUP BY unique_id, project_id HAVING COUNT(*) > 1;
# Expected: (empty result set)
```

---

**Investigation Date**: January 27, 2026  
**Analyzed By**: GitHub Copilot  
**Status**: Ready for Implementation

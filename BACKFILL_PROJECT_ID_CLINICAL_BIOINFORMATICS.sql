-- BACKFILL PROJECT_ID FOR CLINICAL BIOINFORMATICS RECORDS
-- ======================================================
-- 
-- Issue: Clinical bioinformatics records created before the fix have empty project_id
-- Root Cause: alertBioinformaticsMutation wasn't normalizing the lab record,
--            so labRecord.projectId was undefined instead of using project_id from API
--
-- Solution: Backfill project_id from labprocess_clinical_sheet by joining on
--          unique_id and sample_id (which should uniquely identify each record)
--
-- ======================================================

-- STEP 1: Verify the data that will be backfilled
-- (Run this first to see how many records will be updated)
SELECT 
  COUNT(*) as records_to_backfill,
  COUNT(DISTINCT b.unique_id) as unique_samples
FROM bioinformatics_sheet_clinical b
WHERE b.project_id = '' OR b.project_id IS NULL
;

-- STEP 2: Preview the JOIN to see what values will be used
-- (This shows which lab records will be matched)
SELECT 
  b.id as bio_id,
  b.unique_id,
  b.sample_id,
  b.project_id as bio_current_project_id,
  l.id as lab_id,
  l.project_id as lab_project_id,
  l.sample_id as lab_sample_id
FROM bioinformatics_sheet_clinical b
LEFT JOIN labprocess_clinical_sheet l 
  ON b.unique_id = l.unique_id 
  AND b.sample_id = l.sample_id
WHERE (b.project_id = '' OR b.project_id IS NULL)
LIMIT 20
;

-- STEP 3: Update bioinformatics_sheet_clinical with project_id from labprocess_clinical_sheet
-- (Primary join: unique_id + sample_id - should be exact match)
UPDATE bioinformatics_sheet_clinical b
SET b.project_id = (
  SELECT l.project_id
  FROM labprocess_clinical_sheet l
  WHERE b.unique_id = l.unique_id
    AND b.sample_id = l.sample_id
  LIMIT 1
)
WHERE (b.project_id = '' OR b.project_id IS NULL)
  AND EXISTS (
    SELECT 1
    FROM labprocess_clinical_sheet l
    WHERE b.unique_id = l.unique_id
      AND b.sample_id = l.sample_id
  )
;

-- STEP 4: Check if any records still have empty project_id
-- (These may require manual intervention or custom JOIN logic)
SELECT 
  COUNT(*) as unmatched_records,
  GROUP_CONCAT(DISTINCT b.unique_id ORDER BY b.unique_id SEPARATOR ', ') as unique_ids
FROM bioinformatics_sheet_clinical b
WHERE (b.project_id = '' OR b.project_id IS NULL)
;

-- STEP 5: For unmatched records, try a fallback: join only by unique_id
-- (Use the most recent labprocess record for that unique_id)
UPDATE bioinformatics_sheet_clinical b
SET b.project_id = (
  SELECT l.project_id
  FROM labprocess_clinical_sheet l
  WHERE b.unique_id = l.unique_id
  ORDER BY l.id DESC
  LIMIT 1
)
WHERE (b.project_id = '' OR b.project_id IS NULL)
  AND EXISTS (
    SELECT 1
    FROM labprocess_clinical_sheet l
    WHERE b.unique_id = l.unique_id
  )
;

-- STEP 6: Verify the backfill was successful
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN project_id != '' AND project_id IS NOT NULL THEN 1 END) as records_with_project_id,
  COUNT(CASE WHEN project_id = '' OR project_id IS NULL THEN 1 END) as records_without_project_id
FROM bioinformatics_sheet_clinical
;

-- STEP 7: Show sample of backfilled records
SELECT 
  id,
  unique_id,
  sample_id,
  project_id,
  created_at,
  created_by
FROM bioinformatics_sheet_clinical
WHERE project_id LIKE 'PG%' OR project_id LIKE 'DG%'
ORDER BY id DESC
LIMIT 20
;

-- ======================================================
-- Summary of what was fixed in code:
-- ======================================================
-- File: client/src/pages/LabProcessing.tsx
-- Function: alertBioinformaticsMutation
-- Change: When finding the lab record from discoveryRows/clinicalRows,
--        now call normalizeLab() to convert snake_case to camelCase
--
-- Before:
--   labRecord = sourceList.find((l: any) => String(l.id) === String(labId));
--   // labRecord.projectId is undefined (raw API has project_id, not projectId)
--   project_id: labRecord.projectId || labRecord._raw?.project_id || '', // empty!
--
-- After:
--   const rawRecord = sourceList.find((l: any) => String(l.id) === String(labId));
--   if (rawRecord) {
--     labRecord = normalizeLab(rawRecord); // converts project_id -> projectId
--   }
--   project_id: labRecord.projectId || labRecord._raw?.project_id || '', // now has value!
-- ======================================================

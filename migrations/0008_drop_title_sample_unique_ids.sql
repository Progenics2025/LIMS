-- Migration: 0008_drop_title_sample_unique_ids.sql
-- Safely drop title_unique_id and sample_unique_id from `samples` if they exist

-- Drop title_unique_id if exists
SELECT IF(COUNT(*)>0,
  'ALTER TABLE `samples` DROP COLUMN `title_unique_id`',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'title_unique_id';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop sample_unique_id if exists
SELECT IF(COUNT(*)>0,
  'ALTER TABLE `samples` DROP COLUMN `sample_unique_id`',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'sample_unique_id';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- End of migration

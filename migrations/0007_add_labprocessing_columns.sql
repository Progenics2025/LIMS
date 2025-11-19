-- Migration: 0007_add_labprocessing_columns.sql
-- Adds detailed processing columns to `lab_processing` table referenced by application code
-- Uses conditional dynamic SQL per column for compatibility

-- sample_type
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `sample_type` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'sample_type';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- extraction_method
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `extraction_method` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'extraction_method';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- concentration
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `concentration` DECIMAL(8,2) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'concentration';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- purity
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `purity` DECIMAL(5,2) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'purity';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- volume
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `volume` DECIMAL(8,2) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'volume';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- quality_score
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `quality_score` VARCHAR(50) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'quality_score';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- processing_notes
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `processing_notes` TEXT NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'processing_notes';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- equipment_used
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `equipment_used` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'equipment_used';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- reagents
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `reagents` JSON NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'reagents';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- processing_time
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `processing_time` INT NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'processing_time';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- temperature
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `temperature` DECIMAL(5,2) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'temperature';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- humidity
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `humidity` DECIMAL(5,2) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'humidity';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- title_unique_id
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `title_unique_id` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'title_unique_id';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sample_delivery_date
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `sample_delivery_date` TIMESTAMP NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'sample_delivery_date';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- service_name
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `service_name` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'service_name';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- protocol_1
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `protocol_1` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'protocol_1';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- isolation_method
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `isolation_method` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'isolation_method';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- quality_check_dna
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `quality_check_dna` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'quality_check_dna';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- status_dna_extraction
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `status_dna_extraction` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'status_dna_extraction';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- protocol_2
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `protocol_2` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'protocol_2';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- library_preparation_protocol
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `library_preparation_protocol` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'library_preparation_protocol';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- quality_check_2
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `quality_check_2` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'quality_check_2';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- purification_protocol
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `purification_protocol` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'purification_protocol';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- product_quality_check
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `product_quality_check` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'product_quality_check';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- status_library_preparation
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `status_library_preparation` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'status_library_preparation';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- transit_status
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `transit_status` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'transit_status';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- finance_approval
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `finance_approval` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'finance_approval';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- complete_status
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `complete_status` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'complete_status';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- progenics_trf
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `lab_processing` ADD COLUMN `progenics_trf` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'lab_processing' AND column_name = 'progenics_trf';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;


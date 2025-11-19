-- 0009_add_finance_columns.sql
-- Add columns used by the Finance UI to the finance_records table if they do not exist

SET @db := DATABASE();

-- helper: iterate through columns to add

-- The above helper was removed because SELECT ... INTO returned multiple rows on some MySQL servers.
-- Use the explicit conditional ALTER TABLE statements below instead.

-- Fallback explicit conditional add statements for each column

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'title_unique_id') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `title_unique_id` VARCHAR(100) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'date_sample_collected') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `date_sample_collected` TIMESTAMP NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'organization') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `organization` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'clinician') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `clinician` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'city') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `city` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'patient_name') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `patient_name` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'patient_email') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `patient_email` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'patient_phone') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `patient_phone` VARCHAR(50) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'service_name') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `service_name` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'budget') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `budget` DECIMAL(10,2) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'sales_responsible_person') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `sales_responsible_person` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- invoice_amount, invoice_date
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'invoice_amount') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `invoice_amount` DECIMAL(10,2) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'invoice_date') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `invoice_date` TIMESTAMP NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- payment received and related fields
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'payment_received_amount') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `payment_received_amount` DECIMAL(10,2) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'utr_details') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `utr_details` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'balance_amount_received_date') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `balance_amount_received_date` TIMESTAMP NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- remaining financial breakdown fields
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'total_payment_received_status') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `total_payment_received_status` VARCHAR(100) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'phlebotomist_charges') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `phlebotomist_charges` DECIMAL(10,2) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'sample_shipment_amount') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `sample_shipment_amount` DECIMAL(10,2) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'third_party_charges') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `third_party_charges` DECIMAL(10,2) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'other_charges') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `other_charges` DECIMAL(10,2) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'third_party_name') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `third_party_name` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'third_party_contract_details') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `third_party_contract_details` TEXT NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'third_party_payment_status') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `third_party_payment_status` VARCHAR(100) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'progenics_trf') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `progenics_trf` VARCHAR(255) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- approve flags and createdBy
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'approve_to_lab_process') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `approve_to_lab_process` BOOLEAN DEFAULT FALSE', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'approve_to_report_process') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `approve_to_report_process` BOOLEAN DEFAULT FALSE', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'finance_records' AND column_name = 'created_by') = 0,
  'ALTER TABLE `finance_records` ADD COLUMN `created_by` VARCHAR(36) NULL', 'SELECT "NOOP"'
) INTO @s; PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- done
SELECT 'done' as migration_status;

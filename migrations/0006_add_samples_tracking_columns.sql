
-- Migration: 0006_add_samples_tracking_columns.sql
-- Adds additional tracking/logistics columns to `samples` table which are referenced by server code
-- Uses conditional dynamic SQL per column so it works on MySQL versions without ADD COLUMN IF NOT EXISTS

-- Helper: for each column, prepare and execute an ALTER if the column is missing
-- Replace DATABASE() if you need to target another schema

-- title_unique_id
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `title_unique_id` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'title_unique_id';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sample_unique_id
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `sample_unique_id` VARCHAR(64) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'sample_unique_id';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sample_collected_date
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `sample_collected_date` TIMESTAMP NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'sample_collected_date';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sample_shipped_date
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `sample_shipped_date` TIMESTAMP NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'sample_shipped_date';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sample_delivery_date
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `sample_delivery_date` TIMESTAMP NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'sample_delivery_date';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- responsible_person
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `responsible_person` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'responsible_person';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- organization
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `organization` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'organization';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sender_city
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `sender_city` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'sender_city';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- sender_contact
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `sender_contact` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'sender_contact';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- receiver_address
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `receiver_address` TEXT NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'receiver_address';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tracking_id
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `tracking_id` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'tracking_id';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- courier_company
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `courier_company` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'courier_company';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- lab_alert_status
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `lab_alert_status` VARCHAR(50) NULL DEFAULT "pending"',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'lab_alert_status';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- third_party_name
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `third_party_name` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'third_party_name';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- third_party_contract_details
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `third_party_contract_details` TEXT NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'third_party_contract_details';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- third_party_sent_date
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `third_party_sent_date` TIMESTAMP NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'third_party_sent_date';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- third_party_received_date
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `third_party_received_date` TIMESTAMP NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'third_party_received_date';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- comments
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `comments` TEXT NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'comments';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- lab_destination
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `lab_destination` VARCHAR(100) NULL DEFAULT "internal"',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'lab_destination';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- third_party_lab
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `third_party_lab` VARCHAR(255) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'third_party_lab';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- third_party_address
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `third_party_address` TEXT NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'third_party_address';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- courier_partner
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `courier_partner` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'courier_partner';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pickup_date
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `pickup_date` TIMESTAMP NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'pickup_date';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- tracking_number
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `tracking_number` VARCHAR(100) NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'tracking_number';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- shipping_cost
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `shipping_cost` DECIMAL(10,2) NULL DEFAULT 0',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'shipping_cost';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- special_instructions
SELECT IF(COUNT(*)=0,
  'ALTER TABLE `samples` ADD COLUMN `special_instructions` TEXT NULL',
  'SELECT 1') INTO @s
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'samples' AND column_name = 'special_instructions';
PREPARE stmt FROM @s; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- End of migration

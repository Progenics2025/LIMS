-- 0018_create_genetic_counselling_records.sql
-- Migration: create genetic_counselling_records table

CREATE TABLE IF NOT EXISTS `genetic_counselling_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  `unique_id` VARCHAR(255) NOT NULL,
  `project_id` BIGINT UNSIGNED NULL,

  `counselling_date` DATE NULL,
  `gc_registration_start_time` TIME NULL,
  `gc_registration_end_time` TIME NULL,

  `patient_client_name` VARCHAR(255) NULL,
  `age` INT NULL,
  `gender` VARCHAR(20) NULL,
  `patient_client_email` VARCHAR(255) NULL,
  `patient_client_phone` VARCHAR(50) NULL,
  `patient_client_address` VARCHAR(255) NULL,

  `payment_status` VARCHAR(100) NULL,
  `mode_of_payment` VARCHAR(100) NULL,
  `approval_from_head` TINYINT(1) DEFAULT 0,

  `clinician_researcher_name` VARCHAR(255) NULL,
  `organisation_hospital` VARCHAR(255) NULL,
  `speciality` VARCHAR(255) NULL,

  `query_suspection` VARCHAR(500) NULL,
  `gc_name` VARCHAR(255) NULL,
  `gc_other_members` VARCHAR(255) NULL,

  `service_name` VARCHAR(255) NULL,
  `counseling_type` VARCHAR(255) NULL,
  `counseling_start_time` TIME NULL,
  `counseling_end_time` TIME NULL,

  `budget_for_test_opted` DECIMAL(10,2) NULL,
  `testing_status` VARCHAR(255) NULL,
  `action_required` VARCHAR(255) NULL,
  `potential_patient_for_testing_in_future` TINYINT(1) DEFAULT 0,
  `extended_family_testing_requirement` TINYINT(1) DEFAULT 0,
  `budget` DECIMAL(10,2) NULL,

  `sample_type` VARCHAR(255) NULL,
  `gc_summary_sheet` TEXT NULL,
  `gc_video_link` VARCHAR(500) NULL,
  `gc_audio_link` VARCHAR(500) NULL,

  `sales_responsible_person` VARCHAR(255) NULL,

  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by` VARCHAR(255) NULL,
  `modified_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `modified_by` VARCHAR(255) NULL,

  `remark_comment` TEXT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_gc_unique_id` (`unique_id`),
  KEY `idx_project_id` (`project_id`),
  KEY `idx_counselling_date` (`counselling_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

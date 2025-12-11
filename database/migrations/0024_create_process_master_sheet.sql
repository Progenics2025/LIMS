-- Migration 0024: Create process_master_sheet table
-- Purpose: Consolidated master sheet tracking across modules

CREATE TABLE IF NOT EXISTS process_master_sheet (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  unique_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) NULL,
  sample_id VARCHAR(255) NULL,
  client_id VARCHAR(255) NULL,

  organisation_hospital VARCHAR(255) NULL,
  clinician_researcher_name VARCHAR(255) NULL,
  speciality VARCHAR(255) NULL,
  clinician_researcher_email VARCHAR(255) NULL,
  clinician_researcher_phone VARCHAR(50) NULL,
  clinician_researcher_address VARCHAR(255) NULL,

  patient_client_name VARCHAR(255) NULL,
  age INT NULL,
  gender VARCHAR(20) NULL,
  patient_client_email VARCHAR(255) NULL,
  patient_client_phone VARCHAR(50) NULL,
  patient_client_address VARCHAR(255) NULL,

  sample_collection_date DATE NULL,
  sample_recevied_date DATE NULL,
  service_name VARCHAR(255) NULL,
  sample_type VARCHAR(255) NULL,
  no_of_samples INT NULL,

  tat VARCHAR(100) NULL,
  sales_responsible_person VARCHAR(255) NULL,

  progenics_trf VARCHAR(255) NULL,
  third_party_trf VARCHAR(255) NULL,
  progenics_report VARCHAR(500) NULL,

  sample_sent_to_third_party_date DATE NULL,
  third_party_name VARCHAR(255) NULL,
  third_party_report VARCHAR(500) NULL,
  results_raw_data_received_from_third_party_date DATE NULL,

  logistic_status VARCHAR(255) NULL,
  finance_status VARCHAR(255) NULL,
  lab_process_status VARCHAR(255) NULL,
  bioinformatics_status VARCHAR(255) NULL,
  nutritional_management_status VARCHAR(255) NULL,
  progenics_report_release_date DATE NULL,

  Remark_Comment TEXT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NULL,
  modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  modified_by VARCHAR(255) NULL,

  PRIMARY KEY (id),
  UNIQUE KEY ux_process_unique_id (unique_id),
  KEY idx_project_id (project_id),
  KEY idx_sample_id (sample_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


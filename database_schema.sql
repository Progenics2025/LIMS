-- ============================================================================
-- LeadLab LIMS - Consolidated Database Schema (Cleaned - No Backticks)
-- ============================================================================

-- Migration 0015: Lead Management

CREATE TABLE IF NOT EXISTS lead_management (
  -- Identity & IDs
  id VARCHAR(36) PRIMARY KEY,
  unique_id VARCHAR(100) UNIQUE,
  project_id VARCHAR(100),

  -- Lead/Type Information
  lead_type VARCHAR(100),  -- individual, project, clinical_trial, r_and_d
  status VARCHAR(50) DEFAULT 'quoted',  -- quoted, cold, hot, won, converted, closed

  -- Organization/Clinic Information
  organisation_hospital VARCHAR(255),
  clinician_researcher_name VARCHAR(255),
  speciality VARCHAR(255),
  clinician_researcher_email VARCHAR(255),
  clinician_researcher_phone VARCHAR(50),
  clinician_researcher_address VARCHAR(500),

  -- Patient/Client Information
  patient_client_name VARCHAR(255),
  age INT,
  gender VARCHAR(20),
  patient_client_email VARCHAR(255),
  patient_client_phone VARCHAR(50),
  patient_client_address VARCHAR(500),

  -- Testing & Service Information
  service_name VARCHAR(255),
  sample_type VARCHAR(255),
  test_category VARCHAR(50),  -- clinical or discovery
  no_of_samples INT,

  -- Financial Information
  budget DECIMAL(10, 2),
  amount_quoted DECIMAL(10,2),
  tat VARCHAR(50),

  sample_shipment_amount DECIMAL(10, 2),
  phlebotomist_charges DECIMAL(10, 2),

  -- Counselling Requirements
  genetic_counselor_required BOOLEAN DEFAULT FALSE,
  nutritional_counselling_required BOOLEAN DEFAULT FALSE,

  -- Pickup & Delivery Details
  sample_pick_up_from VARCHAR(500),
  delivery_up_to TIMESTAMP,
  sample_collection_date TIMESTAMP,
  sample_shipped_date TIMESTAMP,
  sample_recevied_date TIMESTAMP,

  -- Logistics Information
  tracking_id VARCHAR(100),
  courier_company VARCHAR(255),
  progenics_trf VARCHAR(255),

  -- Follow-up & Notes
  follow_up VARCHAR(500),
  Remark_Comment TEXT,

  -- Audit Trail
  lead_created_by VARCHAR(36),
  sales_responsible_person VARCHAR(255),
  lead_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lead_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for common queries
  INDEX idx_unique_id (unique_id),
  INDEX idx_project_id (project_id),
  INDEX idx_status (status),
  INDEX idx_organisation (organisation_hospital),
  INDEX idx_patient_name (patient_client_name),
  INDEX idx_lead_created (lead_created),
  INDEX idx_sample_collection_date (sample_collection_date),
  INDEX idx_service_name (service_name)
);


CREATE TABLE IF NOT EXISTS sample_tracking (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,

  unique_id VARCHAR(80),
  project_id VARCHAR(80),

  sample_collection_date DATE,
  sample_shipped_date DATE,
  sample_delivery_date DATE,
  sample_pick_up_from VARCHAR(255),
  delivery_up_to VARCHAR(255),

  tracking_id VARCHAR(120),
  courier_company VARCHAR(200),
  sample_shipment_amount DECIMAL(10,2),

  organisation_hospital VARCHAR(255),
  clinician_researcher_name VARCHAR(200),
  clinician_researcher_phone VARCHAR(60),

  patient_client_name VARCHAR(200),
  patient_client_phone VARCHAR(60),

  sample_recevied_date DATE,

  sales_responsible_person VARCHAR(200),

  third_party_name VARCHAR(200),
  third_party_phone VARCHAR(60),
  sample_sent_to_third_party_date DATE,
  sample_received_to_third_party_date DATE,

  alert_to_labprocess_team TINYINT(1) DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(80),

  remark_comment TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS finance_sheet (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- IDs
  unique_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) NOT NULL,

  -- Required fields
  sample_collection_date DATE NULL,

  -- Clinician / Organisation
  organisation_hospital VARCHAR(255) NULL,
  clinician_researcher_name VARCHAR(255) NULL,
  clinician_researcher_email VARCHAR(255) NULL,
  clinician_researcher_phone VARCHAR(50) NULL,
  clinician_researcher_address VARCHAR(255) NULL,

  -- Patient Information
  patient_client_name VARCHAR(255) NULL,
  patient_client_email VARCHAR(255) NULL,
  patient_client_phone VARCHAR(50) NULL,
  patient_client_address VARCHAR(255) NULL,

  -- Service & Financials
  service_name VARCHAR(255) NULL,
  budget DECIMAL(10,2) NULL,
  phlebotomist_charges DECIMAL(10,2) NULL,
  sales_responsible_person VARCHAR(255) NULL,
  sample_shipment_amount DECIMAL(10,2) NULL,

  -- Invoice Section
  invoice_number VARCHAR(255) NULL,
  invoice_amount DECIMAL(10,2) NULL,
  invoice_date DATE NULL,

  -- Payment Section
  payment_receipt_amount DECIMAL(10,2) NULL,
  balance_amount DECIMAL(10,2) NULL,
  payment_receipt_date DATE NULL,
  mode_of_payment VARCHAR(100) NULL,
  transactional_number VARCHAR(255) NULL,
  balance_amount_received_date DATE NULL,
  total_amount_received_status TINYINT(1) DEFAULT 0,
  utr_details VARCHAR(255) NULL,

  -- Third Party Section
  third_party_charges DECIMAL(10,2) NULL,
  other_charges DECIMAL(10,2) NULL,
  other_charges_reason VARCHAR(255) NULL,
  third_party_name VARCHAR(255) NULL,
  third_party_phone VARCHAR(50) NULL,
  third_party_payment_date DATE NULL,
  third_party_payment_status TINYINT(1) DEFAULT 0,

  -- Alerts (Corrected to requirement)
  alert_to_labprocess_team TINYINT(1) DEFAULT 0,
  alert_to_report_team TINYINT(1) DEFAULT 0,
  alert_to_technical_lead TINYINT(1) DEFAULT 0,

  -- Audit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NULL,
  modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  modified_by VARCHAR(255) NULL,

  -- Remarks
  remark_comment TEXT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY ux_finance_unique_id (unique_id),
  KEY idx_project_id (project_id),
  KEY idx_invoice_number (invoice_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS genetic_counselling_records (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  unique_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255)  NULL,

  counselling_date DATE NULL,
  gc_registration_start_time TIME NULL,
  gc_registration_end_time TIME NULL,

  patient_client_name VARCHAR(255) NULL,
  age INT NULL,
  gender VARCHAR(20) NULL,
  patient_client_email VARCHAR(255) NULL,
  patient_client_phone VARCHAR(50) NULL,
  patient_client_address VARCHAR(255) NULL,

  payment_status VARCHAR(100) NULL,
  mode_of_payment VARCHAR(100) NULL,
  approval_from_head TINYINT(1) DEFAULT 0,

  clinician_researcher_name VARCHAR(255) NULL,
  organisation_hospital VARCHAR(255) NULL,
  speciality VARCHAR(255) NULL,

  query_suspection VARCHAR(500) NULL,
  gc_name VARCHAR(255) NULL,
  gc_other_members VARCHAR(255) NULL,

  service_name VARCHAR(255) NULL,
  counseling_type VARCHAR(255) NULL,
  counseling_start_time TIME NULL,
  counseling_end_time TIME NULL,

  budget_for_test_opted DECIMAL(10,2) NULL,
  testing_status VARCHAR(255) NULL,
  action_required VARCHAR(255) NULL,
  potential_patient_for_testing_in_future TINYINT(1) DEFAULT 0,
  extended_family_testing_requirement TINYINT(1) DEFAULT 0,
  budget DECIMAL(10,2) NULL,

  sample_type VARCHAR(255) NULL,
  gc_summary_sheet TEXT NULL,
  gc_video_link VARCHAR(500) NULL,
  gc_audio_link VARCHAR(500) NULL,

  sales_responsible_person VARCHAR(255) NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255) NULL,
  modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  modified_by VARCHAR(255) NULL,

  remark_comment TEXT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY ux_gc_unique_id (unique_id),
  KEY idx_project_id (project_id),
  KEY idx_counselling_date (counselling_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE labprocess_discovery_sheet (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255)  NULL,
    sample_id VARCHAR(255) NULL,
    client_id VARCHAR(255) NULL,

    -- Sample details
    service_name VARCHAR(255) NULL,
    sample_type VARCHAR(255) NULL,
    no_of_samples INT NULL,
    sample_received_date DATE NULL,

    -- Extraction workflow
    extraction_protocol VARCHAR(255) NULL,
    extraction_quality_check VARCHAR(255) NULL,
    extraction_qc_status VARCHAR(100) NULL,
    extraction_process VARCHAR(255) NULL,

    -- Library preparation
    library_preparation_protocol VARCHAR(255) NULL,
    library_preparation_quality_check VARCHAR(255) NULL,
    library_preparation_qc_status VARCHAR(100) NULL,
    library_preparation_process VARCHAR(255) NULL,

    -- Purification workflow
    purification_protocol VARCHAR(255) NULL,
    purification_quality_check VARCHAR(255) NULL,
    purification_qc_status VARCHAR(100) NULL,
    purification_process VARCHAR(255) NULL,

    -- Alerts / Notifications
    alert_to_bioinformatics_team TINYINT(1) DEFAULT 0,
    alert_to_technical_leadd TINYINT(1) DEFAULT 0,

    -- Internal tracking
    progenics_trf VARCHAR(255) NULL,

    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(255) NULL,

    remark_comment TEXT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY ux_lab_process_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE labprocess_clinical_sheet (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255)  NULL,
    sample_id VARCHAR(255) NULL,
    client_id VARCHAR(255) NULL,

    -- Sample details
    service_name VARCHAR(255) NULL,
    sample_type VARCHAR(255) NULL,
    no_of_samples INT NULL,
    sample_received_date DATE NULL,

    -- Extraction workflow
    extraction_protocol VARCHAR(255) NULL,
    extraction_quality_check VARCHAR(255) NULL,
    extraction_qc_status VARCHAR(100) NULL,
    extraction_process VARCHAR(255) NULL,

    -- Library preparation
    library_preparation_protocol VARCHAR(255) NULL,
    library_preparation_quality_check VARCHAR(255) NULL,
    library_preparation_qc_status VARCHAR(100) NULL,
    library_preparation_process VARCHAR(255) NULL,

    -- Purification workflow
    purification_protocol VARCHAR(255) NULL,
    purification_quality_check VARCHAR(255) NULL,
    purification_qc_status VARCHAR(100) NULL,
    purification_process VARCHAR(255) NULL,

    -- Alerts
    alert_to_bioinformatics_team TINYINT(1) DEFAULT 0,
    alert_to_technical_lead TINYINT(1) DEFAULT 0,

    -- Internal tracking
    progenics_trf VARCHAR(255) NULL,

    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(255) NULL,

    remark_comment TEXT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY ux_lab_process_clinical_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE bioinformatics_sheet_clinical (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NULL,
    sample_id VARCHAR(255) NULL,
    client_id VARCHAR(255) NULL,

    -- Organisation + clinician + patient
    organisation_hospital VARCHAR(255) NULL,
    clinician_researcher_name VARCHAR(255) NULL,
    patient_client_name VARCHAR(255) NULL,
    age INT NULL,
    gender VARCHAR(20) NULL,

    -- Sample / sequencing details
    service_name VARCHAR(255) NULL,
    no_of_samples INT NULL,
    sequencing_status VARCHAR(255) NULL,
    sequencing_data_storage_date DATE NULL,

    -- Basecalling workflow
    basecalling VARCHAR(255) NULL,
    basecalling_data_storage_date DATE NULL,

    -- Workflow selection
    workflow_type VARCHAR(255) NULL,

    -- Analysis state
    analysis_status VARCHAR(255) NULL,
    analysis_date DATE NULL,

    -- Third-party workflow
    third_party_name VARCHAR(255) NULL,
    sample_sent_to_third_party_date DATE NULL,
    third_party_trf VARCHAR(255) NULL,
    results_raw_data_received_from_third_party_date DATE NULL,
    third_party_report VARCHAR(255) NULL,

    -- Report turnaround
    tat VARCHAR(100) NULL,

    -- Output files & statuses
    vcf_file_link VARCHAR(500) NULL,
    cnv_status VARCHAR(255) NULL,

    -- Raw data
    progenics_raw_data VARCHAR(500) NULL,
    progenics_raw_data_size VARCHAR(255) NULL,
    progenics_raw_data_link VARCHAR(500) NULL,

    -- Processed data
    analysis_html_link VARCHAR(500) NULL,
    relative_abundance_sheet VARCHAR(500) NULL,
    data_analysis_sheet VARCHAR(500) NULL,
    database_tools_information TEXT NULL,

    -- Alerts
    alert_to_technical_leadd TINYINT(1) DEFAULT 0,
    alert_to_report_team TINYINT(1) DEFAULT 0,

    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(255) NULL,

    remark_comment TEXT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY ux_bioinformatics_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE nutritional_management (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NULL,
    sample_id VARCHAR(255) NULL,

    -- Patient details
    service_name VARCHAR(255) NULL,
    patient_client_name VARCHAR(255) NULL,
    age INT NULL,
    gender VARCHAR(20) NULL,

    -- Input files / questionnaires
    progenics_trf VARCHAR(255) NULL,
    questionnaire TEXT NULL,
    questionnaire_call_recording VARCHAR(500) NULL,

    -- Analysis & reports
    data_analysis_sheet VARCHAR(500) NULL,
    progenics_report VARCHAR(500) NULL,
    nutrition_chart VARCHAR(500) NULL,

    -- Counselling workflow
    counselling_session_date DATE NULL,
    further_counselling_required TINYINT(1) DEFAULT 0,
    counselling_status VARCHAR(255) NULL,
    counselling_session_recording VARCHAR(500) NULL,

    -- Alerts
    alert_to_technical_lead TINYINT(1) DEFAULT 0,
    alert_to_report_team TINYINT(1) DEFAULT 0,

    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(255) NULL,

    remark_comment TEXT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY ux_nutritional_management_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS bioinformatics_sheet_discovery (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NULL,
    sample_id VARCHAR(255) NULL,
    client_id VARCHAR(255) NULL,

    -- Organisation / clinician / patient
    organisation_hospital VARCHAR(255) NULL,
    clinician_researcher_name VARCHAR(255) NULL,
    patient_client_name VARCHAR(255) NULL,
    age INT NULL,
    gender VARCHAR(20) NULL,

    -- Sample / sequencing details
    service_name VARCHAR(255) NULL,
    no_of_samples INT NULL,
    sequencing_status VARCHAR(255) NULL,
    sequencing_data_storage_date DATE NULL,

    -- Basecalling
    basecalling VARCHAR(255) NULL,
    basecalling_data_storage_date DATE NULL,

    -- Workflow / analysis
    workflow_type VARCHAR(255) NULL,
    analysis_status VARCHAR(255) NULL,
    analysis_date DATE NULL,

    -- Third-party work
    third_party_name VARCHAR(255) NULL,
    sample_sent_to_third_party_date DATE NULL,
    third_party_trf VARCHAR(255) NULL,
    results_raw_data_received_from_third_party_date DATE NULL,
    third_party_report VARCHAR(500) NULL,

    -- Turnaround
    tat VARCHAR(100) NULL,

    -- Outputs / files
    vcf_file_link VARCHAR(500) NULL,
    cnv_status VARCHAR(255) NULL,
    progenics_raw_data VARCHAR(500) NULL,
    progenics_raw_data_size VARCHAR(255) NULL,
    progenics_raw_data_link VARCHAR(500) NULL,
    analysis_html_link VARCHAR(500) NULL,
    relative_abundance_sheet VARCHAR(500) NULL,
    data_analysis_sheet VARCHAR(500) NULL,
    database_tools_information TEXT NULL,

    -- Alerts
    alert_to_technical_leadd TINYINT(1) DEFAULT 0,
    alert_to_report_team TINYINT(1) DEFAULT 0,

    -- Audit
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(255) NULL,

    remark_comment TEXT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY ux_bioinformatics_discovery_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


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

-- ============================================================================  
-- USER & ADMIN SETUP  
-- ============================================================================  

CREATE USER IF NOT EXISTS remote_user@'%' IDENTIFIED BY 'Prolab%2305';
GRANT ALL PRIVILEGES ON leadlab_lims.* TO remote_user@'%';
FLUSH PRIVILEGES;

SELECT user, host FROM mysql.user WHERE user = 'remote_user';

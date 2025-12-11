-- 0017_create_finance_sheet.sql
-- Migration: create finance_sheet table

CREATE TABLE IF NOT EXISTS finance_sheet (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- IDs
  unique_id VARCHAR(255) NOT NULL,
  project_id VARCHAR(255) NULL,

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

-- 0016_create_logistic_sheet.sql
-- Migration: create logistic_sheet table

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

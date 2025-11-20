-- Migration: Create project_samples table to consolidate leads and samples
-- This table matches the frontend/backend field requirements for Lead Management

CREATE TABLE IF NOT EXISTS project_samples (
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
  no_of_samples INT,
  
  -- Financial Information
  budget DECIMAL(10, 2),
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
  sample_recevied_date TIMESTAMP,  -- Note: keeping original spelling from requirements
  
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

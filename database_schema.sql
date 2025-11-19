-- LeadLab LIMS MySQL Database Schema
-- Run this script to create the database and tables

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS leadlab_lims;
USE leadlab_lims;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Leads table
CREATE TABLE leads (
    -- Primary key and organizational details
    id VARCHAR(36) PRIMARY KEY,
    organization VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    referred_doctor VARCHAR(255) NOT NULL,
    clinic_hospital_name VARCHAR(255) NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    client_email VARCHAR(255) NOT NULL,

    -- Clinician details
    clinician VARCHAR(255) NULL COMMENT 'Name of the referring clinician/doctor',
    speciality VARCHAR(100) NULL COMMENT 'Medical speciality of the clinician',

    -- Patient information
    patient_name VARCHAR(255) NULL COMMENT 'Full name of the patient',
    patient_email VARCHAR(255) NULL COMMENT 'Email address of the patient',
    patient_phone VARCHAR(50) NULL COMMENT 'Phone number of the patient',
    patient_age INT NULL COMMENT 'Age of the patient',
    patient_gender VARCHAR(20) NULL COMMENT 'Gender (Male/Female/Other)',

    -- Lead and sample details
    test_name VARCHAR(255) NOT NULL,
    sample_type VARCHAR(255) NOT NULL,
    sample_collection_date DATE NULL COMMENT 'Date when the sample was collected',
    
    -- Service and financial details
    service_name VARCHAR(255) NULL COMMENT 'Name of the requested service/test',
    budget DECIMAL(10,2) NULL COMMENT 'Budget amount for the service',
    amount_quoted DECIMAL(10,2) NOT NULL,
    tat INT NOT NULL,

    -- Tracking and logistics
    follow_up TIMESTAMP NULL COMMENT 'Scheduled follow-up date and time',
    pickup_from VARCHAR(500) NULL COMMENT 'Pickup location address',
    pickup_upto TIMESTAMP NULL COMMENT 'Pickup deadline timestamp',
    shipping_amount DECIMAL(10,2) NULL COMMENT 'Courier/shipping charges',
    tracking_id VARCHAR(100) NULL COMMENT 'Courier tracking number',
    courier_company VARCHAR(100) NULL COMMENT 'Name of courier company',
    progenics_trf VARCHAR(100) NULL COMMENT 'Progenics TRF reference number',
    phlebotomist_charges DECIMAL(10,2) NULL COMMENT 'Phlebotomy service charges',

    -- Status and metadata
    status VARCHAR(50) DEFAULT 'quoted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(36) NULL,
    converted_at TIMESTAMP NULL,
    
    -- Constraints
    FOREIGN KEY (created_by) REFERENCES users(id),
    -- Add check constraint for patient_gender values
    CONSTRAINT chk_patient_gender CHECK (patient_gender IS NULL OR patient_gender IN ('Male', 'Female', 'Other'))
);

-- Samples table
CREATE TABLE samples (
    id VARCHAR(36) PRIMARY KEY,
    sample_id VARCHAR(64) NOT NULL UNIQUE,
    title_unique_id VARCHAR(100) NULL UNIQUE COMMENT 'Auto-generated unique identifier for UI/reference',
    lead_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'pickup_scheduled',

    -- Sample timeline
    sample_collected_date DATETIME NULL COMMENT 'Date/time when the sample was collected',
    sample_shipped_date DATETIME NULL COMMENT 'Date/time when the sample was shipped',
    sample_delivery_date DATETIME NULL COMMENT 'Date/time when the sample was delivered',

    -- Logistics & personnel
    responsible_person VARCHAR(255) NULL COMMENT 'Sales person / person responsible for the sample',
    organization VARCHAR(255) NULL COMMENT 'Client organisation name (optional link to leads table)',
    sender_city VARCHAR(255) NULL COMMENT 'Pickup from / origin city',
    sender_contact VARCHAR(100) NULL COMMENT 'Sender phone or contact information',
    receiver_address VARCHAR(500) NULL COMMENT 'Delivery destination / receiver address',
    tracking_id VARCHAR(100) NULL COMMENT 'Courier tracking number',
    courier_company VARCHAR(100) NULL COMMENT 'Courier service provider name',

    -- Lab processing & third party
    lab_alert_status VARCHAR(50) DEFAULT 'pending' COMMENT 'Alert status for lab processing',
    third_party_name VARCHAR(255) NULL COMMENT 'Name of third party lab (if applicable)',
    third_party_contract_details TEXT NULL COMMENT 'Contract details for third party',
    third_party_sent_date DATETIME NULL COMMENT 'Date/time sample sent to third party',
    third_party_received_date DATETIME NULL COMMENT 'Date/time sample received by third party',

    -- Financials and metadata
    courier_details JSON NULL,
    amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT '0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (lead_id) REFERENCES leads(id)
);

-- Lab processing table
CREATE TABLE lab_processing (
    id VARCHAR(36) PRIMARY KEY,
    sample_id VARCHAR(36) NOT NULL,
    lab_id VARCHAR(100) NOT NULL,
    qc_status VARCHAR(100) NULL,
    dna_rna_quantity DECIMAL(8,2) NULL,
    run_id VARCHAR(100) NULL,
    library_prepared BOOLEAN DEFAULT FALSE,
    sequencing_id VARCHAR(100) NULL,
    is_outsourced BOOLEAN DEFAULT FALSE,
    outsource_details JSON NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_by VARCHAR(36) NULL,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Reports table
CREATE TABLE reports (
    id VARCHAR(36) PRIMARY KEY,
    sample_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    report_path VARCHAR(500) NULL,
    generated_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,
    approved_by VARCHAR(36) NULL,
    delivered_at TIMESTAMP NULL,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- Notifications table
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(100) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id VARCHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for better performance
-- Lead management indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_clinician ON leads(clinician);
CREATE INDEX idx_leads_patient_name ON leads(patient_name);
CREATE INDEX idx_leads_follow_up ON leads(follow_up);
CREATE INDEX idx_leads_pickup_upto ON leads(pickup_upto);
CREATE INDEX idx_leads_progenics_trf ON leads(progenics_trf);
CREATE INDEX idx_samples_lead_id ON samples(lead_id);
CREATE INDEX idx_samples_status ON samples(status);
CREATE INDEX idx_lab_processing_sample_id ON lab_processing(sample_id);
CREATE INDEX idx_reports_sample_id ON reports(sample_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Migration: Extend leads table with additional tracking fields
-- Description: Add clinician, patient, and logistics tracking fields to the leads table

-- Add clinician details
ALTER TABLE leads ADD COLUMN clinician VARCHAR(255) NULL COMMENT 'Name of the referring clinician/doctor';
ALTER TABLE leads ADD COLUMN speciality VARCHAR(100) NULL COMMENT 'Medical speciality of the clinician';

-- Add sample details
ALTER TABLE leads ADD COLUMN sample_collection_date DATE NULL COMMENT 'Date when the sample was collected';

-- Add patient information
ALTER TABLE leads ADD COLUMN patient_name VARCHAR(255) NULL COMMENT 'Full name of the patient';
ALTER TABLE leads ADD COLUMN patient_email VARCHAR(255) NULL COMMENT 'Email address of the patient';
ALTER TABLE leads ADD COLUMN patient_phone VARCHAR(50) NULL COMMENT 'Phone number of the patient';
ALTER TABLE leads ADD COLUMN patient_age INT NULL COMMENT 'Age of the patient';
ALTER TABLE leads ADD COLUMN patient_gender VARCHAR(20) NULL COMMENT 'Gender (Male/Female/Other)';

-- Add service and financial details
ALTER TABLE leads ADD COLUMN service_name VARCHAR(255) NULL COMMENT 'Name of the requested service/test';
ALTER TABLE leads ADD COLUMN budget DECIMAL(10,2) NULL COMMENT 'Budget amount for the service';

-- Add tracking and logistics details
ALTER TABLE leads ADD COLUMN follow_up TIMESTAMP NULL COMMENT 'Scheduled follow-up date and time';
ALTER TABLE leads ADD COLUMN pickup_from VARCHAR(500) NULL COMMENT 'Pickup location address';
ALTER TABLE leads ADD COLUMN pickup_upto TIMESTAMP NULL COMMENT 'Pickup deadline timestamp';
ALTER TABLE leads ADD COLUMN shipping_amount DECIMAL(10,2) NULL COMMENT 'Courier/shipping charges';
ALTER TABLE leads ADD COLUMN tracking_id VARCHAR(100) NULL COMMENT 'Courier tracking number';
ALTER TABLE leads ADD COLUMN courier_company VARCHAR(100) NULL COMMENT 'Name of courier company';
ALTER TABLE leads ADD COLUMN progenics_trf VARCHAR(100) NULL COMMENT 'Progenics TRF reference number';
ALTER TABLE leads ADD COLUMN phlebotomist_charges DECIMAL(10,2) NULL COMMENT 'Phlebotomy service charges';

-- Add check constraint for patient_gender values
ALTER TABLE leads ADD CONSTRAINT chk_patient_gender CHECK (patient_gender IS NULL OR patient_gender IN ('Male', 'Female', 'Other'));

-- Create new indexes for improved query performance
CREATE INDEX idx_leads_clinician ON leads(clinician);
CREATE INDEX idx_leads_patient_name ON leads(patient_name);
CREATE INDEX idx_leads_follow_up ON leads(follow_up);
CREATE INDEX idx_leads_pickup_upto ON leads(pickup_upto);
CREATE INDEX idx_leads_progenics_trf ON leads(progenics_trf);
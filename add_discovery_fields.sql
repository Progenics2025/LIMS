-- Add category column and discovery-specific fields to leads table
-- This script adds all the new fields required for discovery leads

-- Add category column if it doesn't exist
ALTER TABLE leads ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'clinical';

-- Add discovery-specific fields
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discovery_organization VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS clinician_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS specialty VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS clinician_org_email VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS clinician_org_phone VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS pickup_from VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS delivery_upto VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS discovery_status VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS follow_up VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_type_discovery VARCHAR(100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS budget DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sample_shipment_amount DECIMAL(10,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS no_of_samples INT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS patient_client_name VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS age INT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS patient_client_phone VARCHAR(50);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS patient_client_email VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sales_responsible_person VARCHAR(255);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS date_sample_received DATE;

-- Update existing records to have a default category if NULL
UPDATE leads SET category = 'clinical' WHERE category IS NULL;

-- Create index for better performance on category column
CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(category);

-- Show the updated table structure
DESCRIBE leads;
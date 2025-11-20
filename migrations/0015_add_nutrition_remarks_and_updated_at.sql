-- Migration: Add nutrition_required, remark, patient_address, sample_shipped_date, and updated_at columns to leads table

-- Add nutrition_required column
ALTER TABLE leads ADD COLUMN IF NOT EXISTS nutrition_required BOOLEAN DEFAULT FALSE;

-- Add remark column for comments and notes
ALTER TABLE leads ADD COLUMN IF NOT EXISTS remark TEXT;

-- Add patient_address column if not exists
ALTER TABLE leads ADD COLUMN IF NOT EXISTS patient_address VARCHAR(255);

-- Add sample_shipped_date column if not exists
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sample_shipped_date TIMESTAMP NULL;

-- Add updated_at column with automatic update
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_nutrition_required ON leads(nutrition_required);
CREATE INDEX IF NOT EXISTS idx_leads_updated_at ON leads(updated_at);

-- Show the updated table structure
DESCRIBE leads;

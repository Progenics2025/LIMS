-- Add category column to leads table
ALTER TABLE leads ADD COLUMN category VARCHAR(50) DEFAULT 'clinical';

-- Update existing records to have a default category
UPDATE leads SET category = 'clinical' WHERE category IS NULL;
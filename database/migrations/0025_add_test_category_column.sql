-- Migration: Add test_category column to lead_management table
-- Purpose: Store Clinical/Discovery category separately to ensure correct Project ID prefix generation

ALTER TABLE lead_management ADD COLUMN test_category VARCHAR(50) DEFAULT 'clinical';

-- Create index on test_category for query optimization
CREATE INDEX idx_test_category ON lead_management(test_category);

-- Update existing records to clinical as default
UPDATE lead_management SET test_category = 'clinical' WHERE test_category IS NULL;

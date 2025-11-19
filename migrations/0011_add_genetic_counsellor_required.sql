-- Add genetic_counsellor_required column to leads table
ALTER TABLE `leads` ADD COLUMN `genetic_counsellor_required` BOOLEAN DEFAULT FALSE;

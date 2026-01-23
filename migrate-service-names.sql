-- SQL Migration Script to update service names from shortened to full names
-- Run this in your MySQL/PostgreSQL database

-- Update Sanger Clinical to full name
UPDATE lead_management 
SET service_name = 'Sanger Sequencing - Clinical' 
WHERE service_name = 'Sanger Clinical';

-- Update Sanger Discovery to full name
UPDATE lead_management 
SET service_name = 'Sanger Sequencing - Discovery' 
WHERE service_name = 'Sanger Discovery';

-- Update WGS to full name
UPDATE lead_management 
SET service_name = 'Whole Genome Sequencing' 
WHERE service_name = 'WGS';

-- Update Targeted Amplicons to full name
UPDATE lead_management 
SET service_name = 'Targeted Amplicons Sequencing' 
WHERE service_name = 'Targeted Amplicons';

-- Update Shotgun to full name
UPDATE lead_management 
SET service_name = 'Shotgun Metagenomics Sequencing' 
WHERE service_name = 'Shotgun';

-- Update WES+ Mito to standardized name
UPDATE lead_management 
SET service_name = 'WES+Mito' 
WHERE service_name = 'WES+ Mito';

-- Check results
SELECT service_name, COUNT(*) as count 
FROM lead_management 
GROUP BY service_name 
ORDER BY service_name;

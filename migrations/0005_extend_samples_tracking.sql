-- Migration 0005: Extend samples table with comprehensive tracking fields
-- Adds identification, timeline, logistics, personnel and third-party tracking columns

ALTER TABLE samples ADD COLUMN title_unique_id VARCHAR(100) NULL UNIQUE COMMENT 'Auto-generated unique identifier for UI/reference';
ALTER TABLE samples ADD COLUMN sample_id VARCHAR(64) NULL UNIQUE;

ALTER TABLE samples ADD COLUMN sample_collected_date DATETIME NULL COMMENT 'Date/time when the sample was collected';
ALTER TABLE samples ADD COLUMN sample_shipped_date DATETIME NULL COMMENT 'Date/time when the sample was shipped';
ALTER TABLE samples ADD COLUMN sample_delivery_date DATETIME NULL COMMENT 'Date/time when the sample was delivered';

ALTER TABLE samples ADD COLUMN responsible_person VARCHAR(255) NULL COMMENT 'Sales person / person responsible for the sample';
ALTER TABLE samples ADD COLUMN organization VARCHAR(255) NULL COMMENT 'Client organisation name (optional link to leads table)';
ALTER TABLE samples ADD COLUMN sender_city VARCHAR(255) NULL COMMENT 'Pickup from / origin city';
ALTER TABLE samples ADD COLUMN sender_contact VARCHAR(100) NULL COMMENT 'Sender phone or contact information';
ALTER TABLE samples ADD COLUMN receiver_address VARCHAR(500) NULL COMMENT 'Delivery destination / receiver address';
ALTER TABLE samples ADD COLUMN tracking_id VARCHAR(100) NULL COMMENT 'Courier tracking number';
ALTER TABLE samples ADD COLUMN courier_company VARCHAR(100) NULL COMMENT 'Courier service provider name';

ALTER TABLE samples ADD COLUMN lab_alert_status VARCHAR(50) DEFAULT 'pending' COMMENT 'Alert status for lab processing';
ALTER TABLE samples ADD COLUMN third_party_name VARCHAR(255) NULL COMMENT 'Name of third party lab (if applicable)';
ALTER TABLE samples ADD COLUMN third_party_contract_details TEXT NULL COMMENT 'Contract details for third party';
ALTER TABLE samples ADD COLUMN third_party_sent_date DATETIME NULL COMMENT 'Date/time sample sent to third party';
ALTER TABLE samples ADD COLUMN third_party_received_date DATETIME NULL COMMENT 'Date/time sample received by third party';

-- Add indexes for common queries
CREATE INDEX idx_samples_title_unique_id ON samples(title_unique_id);
CREATE INDEX idx_samples_sample_id ON samples(sample_id);
CREATE INDEX idx_samples_collected_date ON samples(sample_collected_date);
CREATE INDEX idx_samples_shipped_date ON samples(sample_shipped_date);
CREATE INDEX idx_samples_delivery_date ON samples(sample_delivery_date);
CREATE INDEX idx_samples_tracking_id ON samples(tracking_id);
CREATE INDEX idx_samples_third_party_name ON samples(third_party_name);
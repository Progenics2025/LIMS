-- Migration: add tracking/patient fields to leads table
ALTER TABLE leads
  ADD COLUMN pickup_from VARCHAR(255) DEFAULT NULL,
  ADD COLUMN pickup_upto DATETIME DEFAULT NULL,
  ADD COLUMN shipping_amount DECIMAL(10,2) DEFAULT NULL,
  ADD COLUMN tracking_id VARCHAR(100) DEFAULT NULL,
  ADD COLUMN courier_company VARCHAR(255) DEFAULT NULL,
  ADD COLUMN progenics_trf VARCHAR(255) DEFAULT NULL,
  ADD COLUMN phlebotomist_charges DECIMAL(10,2) DEFAULT NULL;

-- Indexes for frequently queried fields
CREATE INDEX idx_leads_tracking_id ON leads (tracking_id);
CREATE INDEX idx_leads_courier_company ON leads (courier_company);
CREATE INDEX idx_leads_pickup_upto ON leads (pickup_upto);

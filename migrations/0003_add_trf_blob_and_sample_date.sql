-- Migration 0003: add TRF blob storage and date_sample_collected
ALTER TABLE leads
  ADD COLUMN date_sample_collected DATETIME DEFAULT NULL;

CREATE TABLE IF NOT EXISTS lead_trfs (
  id VARCHAR(36) PRIMARY KEY,
  lead_id VARCHAR(36) NULL,
  filename VARCHAR(255),
  data LONGBLOB,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_lead_trf_lead_id (lead_id)
);

-- optional: add foreign key if desired (commented out for safety)
-- ALTER TABLE lead_trfs ADD CONSTRAINT fk_trf_lead FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL;

-- Migration: create genetic_counselling table
CREATE TABLE IF NOT EXISTS genetic_counselling (
  id VARCHAR(36) PRIMARY KEY,
  sample_id VARCHAR(64) NOT NULL,
  gc_name VARCHAR(255) NOT NULL,
  counselling_type VARCHAR(100),
  counselling_start_time DATETIME,
  counselling_end_time DATETIME,
  gc_summary TEXT,
  extended_family_testing BOOLEAN DEFAULT FALSE,
  approval_status VARCHAR(50) DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
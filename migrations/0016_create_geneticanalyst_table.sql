-- Genetic Analyst Table Migration
-- Created on January 21, 2026
-- This migration creates the geneticanalyst table for tracking genetic analysis records

CREATE TABLE IF NOT EXISTS geneticanalyst (
  id VARCHAR(36) PRIMARY KEY,
  unique_id VARCHAR(100) UNIQUE NOT NULL,
  project_id VARCHAR(100) NOT NULL,
  sample_id VARCHAR(100) NOT NULL,
  
  -- Analysis Workflow Dates
  received_date_for_analysis DATE,
  completed_analysis DATE,
  analyzed_by VARCHAR(255),
  
  -- Reviewer Information
  reviewer_comments TEXT,
  
  -- Report Dates
  report_preparation_date DATE,
  report_review_date DATE,
  report_release_date DATE,
  
  -- Additional Information
  remarks TEXT,
  
  -- Audit Trail
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  modified_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  modified_by VARCHAR(255),
  
  -- Indexes for common queries
  INDEX idx_unique_id (unique_id),
  INDEX idx_project_id (project_id),
  INDEX idx_sample_id (sample_id),
  INDEX idx_received_date (received_date_for_analysis),
  INDEX idx_release_date (report_release_date),
  INDEX idx_created_at (created_at)
);

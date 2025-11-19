-- Add bioinformatics tracking table
CREATE TABLE bioinformatics_tracking (
    id VARCHAR(36) PRIMARY KEY,
    sample_id VARCHAR(36) NOT NULL,
    workflow_step VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    qc_metrics JSON,
    files JSON,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    processed_by VARCHAR(36) NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (sample_id) REFERENCES samples(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Create indexes for faster queries
CREATE INDEX idx_bioinformatics_sample_id ON bioinformatics_tracking(sample_id);
CREATE INDEX idx_bioinformatics_status ON bioinformatics_tracking(status);
CREATE INDEX idx_bioinformatics_workflow_step ON bioinformatics_tracking(workflow_step);
-- Migration: Create lab_process_discovery
-- Generated: 2025-11-20
CREATE TABLE labprocess_discovery_sheet (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NULL,
    sample_id VARCHAR(255) NULL,
    client_id VARCHAR(255) NULL,

    -- Sample details
    service_name VARCHAR(255) NULL,
    sample_type VARCHAR(255) NULL,
    no_of_samples INT NULL,
    sample_received_date DATE NULL,

    -- Extraction workflow
    extraction_protocol VARCHAR(255) NULL,
    extraction_quality_check VARCHAR(255) NULL,
    extraction_qc_status VARCHAR(100) NULL,
    extraction_process VARCHAR(255) NULL,

    -- Library preparation
    library_preparation_protocol VARCHAR(255) NULL,
    library_preparation_quality_check VARCHAR(255) NULL,
    library_preparation_qc_status VARCHAR(100) NULL,
    library_preparation_process VARCHAR(255) NULL,

    -- Purification workflow
    purification_protocol VARCHAR(255) NULL,
    purification_quality_check VARCHAR(255) NULL,
    purification_qc_status VARCHAR(100) NULL,
    purification_process VARCHAR(255) NULL,

    -- Alerts / Notifications
    alert_to_bioinformatics_team TINYINT(1) DEFAULT 0,
    alert_to_technical_leadd TINYINT(1) DEFAULT 0,

    -- Internal tracking
    progenics_trf VARCHAR(255) NULL,

    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(255) NULL,

    remark_comment TEXT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY ux_lab_process_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
)
ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

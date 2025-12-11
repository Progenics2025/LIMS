CREATE TABLE bioinformatics_sheet_clinical (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id VARCHAR(255) NULL,
    sample_id VARCHAR(255) NULL,
    client_id VARCHAR(255) NULL,

    -- Organisation + clinician + patient
    organisation_hospital VARCHAR(255) NULL,
    clinician_researcher_name VARCHAR(255) NULL,
    patient_client_name VARCHAR(255) NULL,
    age INT NULL,
    gender VARCHAR(20) NULL,

    -- Sample / sequencing details
    service_name VARCHAR(255) NULL,
    no_of_samples INT NULL,
    sequencing_status VARCHAR(255) NULL,
    sequencing_data_storage_date DATE NULL,

    -- Basecalling workflow
    basecalling VARCHAR(255) NULL,
    basecalling_data_storage_date DATE NULL,

    -- Workflow selection
    workflow_type VARCHAR(255) NULL,

    -- Analysis state
    analysis_status VARCHAR(255) NULL,
    analysis_date DATE NULL,

    -- Third-party workflow
    third_party_name VARCHAR(255) NULL,
    sample_sent_to_third_party_date DATE NULL,
    third_party_trf VARCHAR(255) NULL,
    results_raw_data_received_from_third_party_date DATE NULL,
    third_party_report VARCHAR(255) NULL,

    -- Report turnaround
    tat VARCHAR(100) NULL,

    -- Output files & statuses
    vcf_file_link VARCHAR(500) NULL,
    cnv_status VARCHAR(255) NULL,

    -- Raw data
    progenics_raw_data VARCHAR(500) NULL,
    progenics_raw_data_size VARCHAR(255) NULL,
    progenics_raw_data_link VARCHAR(500) NULL,

    -- Processed data
    analysis_html_link VARCHAR(500) NULL,
    relative_abundance_sheet VARCHAR(500) NULL,
    data_analysis_sheet VARCHAR(500) NULL,
    database_tools_information TEXT NULL,

    -- Alerts
    alert_to_technical_lead TINYINT(1) DEFAULT 0,
    alert_to_report_team TINYINT(1) DEFAULT 0,

    -- Audit fields
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255) NULL,
    modified_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    modified_by VARCHAR(255) NULL,

    remark_comment TEXT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY ux_bioinformatics_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

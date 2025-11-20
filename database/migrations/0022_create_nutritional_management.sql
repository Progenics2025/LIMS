CREATE TABLE nutritional_management (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Identifiers
    unique_id VARCHAR(255) NOT NULL,
    project_id BIGINT UNSIGNED NULL,
    sample_id VARCHAR(255) NULL,

    -- Patient details
    service_name VARCHAR(255) NULL,
    patient_client_name VARCHAR(255) NULL,
    age INT NULL,
    gender VARCHAR(20) NULL,

    -- Input files / questionnaires
    progenics_trf VARCHAR(255) NULL,
    questionnaire TEXT NULL,
    questionnaire_call_recording VARCHAR(500) NULL,

    -- Analysis & reports
    data_analysis_sheet VARCHAR(500) NULL,
    progenics_report VARCHAR(500) NULL,
    nutrition_chart VARCHAR(500) NULL,

    -- Counselling workflow
    counselling_session_date DATE NULL,
    further_counselling_required TINYINT(1) DEFAULT 0,
    counselling_status VARCHAR(255) NULL,
    counselling_session_recording VARCHAR(500) NULL,

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
    UNIQUE KEY ux_nutritional_management_unique_id (unique_id),
    KEY idx_project_id (project_id),
    KEY idx_sample_id (sample_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

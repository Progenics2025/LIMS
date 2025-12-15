-- Schema: report_management
-- Mapping of fields (Sr.No, Field -> column)
-- 1  Unique ID                          -> unique_id
-- 2  Project ID                         -> project_id
-- 3  Report URL                         -> report_url
-- 4  Report release Date                -> report_release_date
-- 5  Organisation / Hospital            -> organisation_hospital
-- 6  Clinician / Researcher Name        -> clinician_researcher_name
-- 7  Clinician / Researcher Email       -> clinician_researcher_email
-- 8  Clinician / Researcher Phone       -> clinician_researcher_phone
-- 9  Clinician / Researcher Address     -> clinician_researcher_address
-- 10 Patient / Client Name              -> patient_client_name
-- 11 Age                                -> age
-- 12 Gender                             -> gender
-- 13 Patient / Client Email             -> patient_client_email
-- 14 Patient / Client Phone             -> patient_client_phone
-- 15 Patient / Client Address           -> patient_client_address
-- 16 Genetic Counselling Required       -> genetic_counselor_required
-- 17 Nutritional Counselling Required   -> nutritional_counselling_required
-- 18 Service Name                       -> service_name
-- 19 TAT (Days)                         -> tat
-- 20 Sample Type                        -> sample_type
-- 21 No of Samples                      -> no_of_samples
-- 22 Sample Received Date               -> sample_received_date
-- 23 Progenics TRF                      -> progenics_trf
-- 24 Approveal from Finance             -> approval_from_finance
-- 25 Sales / Responsible Person         -> sales_responsible_person
-- 26 Lead Created                       -> lead_created_by
-- 27 Lead Modified                      -> lead_modified
-- 28 Remark / Comment                   -> remark_comment
-- 29 GC case Summary                    -> gc_case_summary

CREATE TABLE IF NOT EXISTS report_management (
    unique_id VARCHAR(255) PRIMARY KEY,
    project_id VARCHAR(255),
    report_url TEXT,
    report_release_date DATE,
    organisation_hospital VARCHAR(255),
    clinician_researcher_name VARCHAR(255),
    clinician_researcher_email VARCHAR(255),
    clinician_researcher_phone VARCHAR(50),
    clinician_researcher_address TEXT,
    patient_client_name VARCHAR(255),
    age INTEGER,
    gender VARCHAR(50),
    patient_client_email VARCHAR(255),
    patient_client_phone VARCHAR(50),
    patient_client_address TEXT,
    genetic_counselor_required BOOLEAN DEFAULT FALSE,
    nutritional_counselling_required BOOLEAN DEFAULT FALSE,
    service_name VARCHAR(255),
    tat INTEGER,
    sample_type VARCHAR(100),
    no_of_samples INTEGER,
    sample_received_date DATE,
    progenics_trf VARCHAR(255),
    approval_from_finance BOOLEAN DEFAULT FALSE,
    sales_responsible_person VARCHAR(255),
    lead_created_by VARCHAR(255),
    lead_modified TIMESTAMP,
    remark_comment TEXT,
    gc_case_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes where useful (example):
-- CREATE INDEX idx_report_project ON report_management(project_id);

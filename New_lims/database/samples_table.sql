USE leadlab_lims;

-- Create the samples table for lead conversion
CREATE TABLE IF NOT EXISTS lims_sample_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lead_id INT,
    company_name VARCHAR(255),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    sample_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lead_id) REFERENCES lims_lead_details(id) ON DELETE SET NULL
);

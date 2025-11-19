const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'leadlab_lims',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function createMissingTables() {
    try {
        // Create Raw Data table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lims_raw_data (
                id INT PRIMARY KEY AUTO_INCREMENT,
                sample_id VARCHAR(50),
                test_type VARCHAR(100),
                raw_data_file TEXT,
                analysis_date DATE,
                instrument_id VARCHAR(50),
                analyst VARCHAR(100),
                results TEXT,
                qc_status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sample_id) REFERENCES lims_clinical_samples(sample_id) ON DELETE CASCADE
            )
        `);
        console.log('Raw Data table created successfully');

        // Create Price List table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lims_price_list (
                id INT PRIMARY KEY AUTO_INCREMENT,
                service_id VARCHAR(50) UNIQUE,
                service_name VARCHAR(200),
                category VARCHAR(100),
                base_price DECIMAL(10,2),
                discount DECIMAL(5,2),
                tax_rate DECIMAL(5,2),
                final_price DECIMAL(10,2),
                effective_date DATE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Price List table created successfully');

        // Create Daily Client Report table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lims_daily_client_report (
                id INT PRIMARY KEY AUTO_INCREMENT,
                report_date DATE,
                client_id VARCHAR(50),
                sample_count INT,
                tests_performed TEXT,
                status_summary TEXT,
                issues TEXT,
                actions_taken TEXT,
                next_steps TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Daily Client Report table created successfully');

        // Create Lab Report Clinical table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lims_lab_report_clinical (
                id INT PRIMARY KEY AUTO_INCREMENT,
                report_id VARCHAR(50) UNIQUE,
                sample_id VARCHAR(50),
                patient_id VARCHAR(50),
                test_results TEXT,
                reference_range TEXT,
                interpretation TEXT,
                report_date DATE,
                pathologist VARCHAR(100),
                verification_status VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (sample_id) REFERENCES lims_clinical_samples(sample_id) ON DELETE CASCADE
            )
        `);
        console.log('Lab Report Clinical table created successfully');

        // Create Nutritionist table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS lims_nutritionist (
                id INT PRIMARY KEY AUTO_INCREMENT,
                patient_id VARCHAR(50),
                diet_plan TEXT,
                nutritional_goals TEXT,
                dietary_restrictions TEXT,
                start_date DATE,
                end_date DATE,
                progress_notes TEXT,
                recommendations TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        console.log('Nutritionist table created successfully');

    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}

async function importExcelData(filePath, tableName, columnMappings) {
    try {
        // Temporarily disable foreign key checks
        await pool.query('SET FOREIGN_KEY_CHECKS = 0');
        
        // Truncate the table
        await pool.query(`TRUNCATE TABLE ${tableName}`);
        console.log(`Truncated table: ${tableName}`);
        
        // Re-enable foreign key checks
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');

        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        for (const row of data) {
            const mappedData = {};
            for (const [excelColumn, dbColumn] of Object.entries(columnMappings)) {
                if (row[excelColumn] !== undefined) {
                    mappedData[dbColumn] = row[excelColumn];
                }
            }

            const columns = Object.keys(mappedData);
            const values = Object.values(mappedData);
            const placeholders = values.map(() => '?').join(',');

            const query = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES (${placeholders})`;
            await pool.query(query, values);
        }

        console.log(`Successfully imported data from ${path.basename(filePath)} to ${tableName}`);
    } catch (error) {
        console.error(`Error importing data from ${path.basename(filePath)}:`, error);
        throw error;
    }
}

async function importAllData() {
    try {
        // Create all missing tables first
        await createMissingTables();
        
        const sheetsDir = path.join(__dirname, 'Sharepoint_sheets');

        // Import Lead Sheet
        await importExcelData(
            path.join(sheetsDir, 'Lead_sheet_shubham.xlsx'),
            'lims_lead_details',
            {
                'Company Name': 'company_name',
                'Contact Person': 'contact_person',
                'Designation': 'designation',
                'Email': 'email',
                'Phone': 'phone',
                'Location': 'location',
                'Lead Source': 'lead_source',
                'Status': 'lead_status',
                'Remarks': 'remarks'
            }
        );

        // Import Clinical Samples
        await importExcelData(
            path.join(sheetsDir, 'Lab process_Clinical_Samples.xlsx'),
            'lims_clinical_samples',
            {
                'Sample ID': 'sample_id',
                'Patient ID': 'patient_id',
                'Sample Type': 'sample_type',
                'Collection Date': 'collection_date',
                'Received Date': 'received_date',
                'Test Name': 'test_name',
                'Processing Status': 'processing_status',
                'QC Status': 'qc_status',
                'Remarks': 'remarks'
            }
        );

        // Import Discovery Samples
        await importExcelData(
            path.join(sheetsDir, 'Lab process_Discovery Samples.xlsx'),
            'lims_discovery_samples',
            {
                'Sample ID': 'sample_id',
                'Client ID': 'client_id',
                'Sample Type': 'sample_type',
                'Received Date': 'received_date',
                'Test Required': 'test_required',
                'Processing Status': 'processing_status',
                'QC Status': 'qc_status',
                'Remarks': 'remarks'
            }
        );

        // Import Finance Data
        await importExcelData(
            path.join(sheetsDir, 'Lab_Finance.xlsx'),
            'lims_finance',
            {
                'Invoice Number': 'invoice_number',
                'Client ID': 'client_id',
                'Service Type': 'service_type',
                'Amount': 'amount',
                'Tax Amount': 'tax_amount',
                'Total Amount': 'total_amount',
                'Payment Status': 'payment_status',
                'Payment Date': 'payment_date',
                'Payment Method': 'payment_method',
                'Remarks': 'remarks'
            }
        );

        // Import Inside Sales Data
        await importExcelData(
            path.join(sheetsDir, 'Inside Sales sheet.xlsx'),
            'lims_inside_sales',
            {
                'Client ID': 'client_id',
                'Company Name': 'company_name',
                'Contact Person': 'contact_person',
                'Product Interest': 'product_interest',
                'Meeting Date': 'meeting_date',
                'Follow Up Date': 'follow_up_date',
                'Status': 'status',
                'Remarks': 'remarks'
            }
        );

        // Import Lab Raw Data
        await importExcelData(
            path.join(sheetsDir, 'Lab Raw data sheet.xlsx'),
            'lims_raw_data',
            {
                'Sample ID': 'sample_id',
                'Test Type': 'test_type',
                'Raw Data File': 'raw_data_file',
                'Analysis Date': 'analysis_date',
                'Instrument ID': 'instrument_id',
                'Analyst': 'analyst',
                'Results': 'results',
                'QC Status': 'qc_status'
            }
        );

        // Import Technical Discovery Data
        await importExcelData(
            path.join(sheetsDir, 'Technical_Discovery samples.xlsx'),
            'lims_technical_discovery',
            {
                'Sample ID': 'sample_id',
                'Project ID': 'project_id',
                'Technical Details': 'technical_details',
                'Method Used': 'method_used',
                'Parameters': 'parameters',
                'Results': 'results',
                'Analysis Date': 'analysis_date',
                'Scientist': 'scientist',
                'Status': 'status'
            }
        );

        // Import Logistics Data
        await importExcelData(
            path.join(sheetsDir, 'Logistics_sheet.xlsx'),
            'lims_logistics',
            {
                'Shipment ID': 'shipment_id',
                'Sample ID': 'sample_id',
                'Client ID': 'client_id',
                'Shipping Date': 'shipping_date',
                'Delivery Date': 'delivery_date',
                'Courier Service': 'courier_service',
                'Tracking Number': 'tracking_number',
                'Status': 'status',
                'Special Requirements': 'special_requirements'
            }
        );

        // Import Nutritionist Data
        await importExcelData(
            path.join(sheetsDir, 'Nutrionist sheet.xlsx'),
            'lims_nutritionist',
            {
                'Patient ID': 'patient_id',
                'Diet Plan': 'diet_plan',
                'Nutritional Goals': 'nutritional_goals',
                'Dietary Restrictions': 'dietary_restrictions',
                'Start Date': 'start_date',
                'End Date': 'end_date',
                'Progress Notes': 'progress_notes',
                'Recommendations': 'recommendations'
            }
        );

        // Import Process Master Clinical Data
        await importExcelData(
            path.join(sheetsDir, 'Process_Master_sheet_Clinical.xlsx'),
            'lims_process_master_clinical',
            {
                'Process ID': 'process_id',
                'Process Name': 'process_name',
                'SOP Number': 'sop_number',
                'Equipment Required': 'equipment_required',
                'Materials Required': 'materials_required',
                'Quality Parameters': 'quality_parameters',
                'Process Duration': 'process_duration',
                'Department': 'department'
            }
        );

        // Import Process Master Discovery Data
        await importExcelData(
            path.join(sheetsDir, 'Process_Master_sheet_Discovery.xlsx'),
            'lims_process_master_discovery',
            {
                'Process ID': 'process_id',
                'Process Name': 'process_name',
                'Method Type': 'method_type',
                'Equipment Setup': 'equipment_setup',
                'Parameters': 'parameters',
                'Control Measures': 'control_measures',
                'Duration': 'duration',
                'Department': 'department'
            }
        );

        // Import Market Survey Data
        await importExcelData(
            path.join(sheetsDir, 'Marketsurvey form.xlsx'),
            'lims_market_survey',
            {
                'Survey ID': 'survey_id',
                'Company Name': 'company_name',
                'Contact Person': 'contact_person',
                'Market Segment': 'market_segment',
                'Product Interest': 'product_interest',
                'Competitor Analysis': 'competitor_analysis',
                'Survey Date': 'survey_date',
                'Feedback': 'feedback'
            }
        );

        // Import Price List Data
        await importExcelData(
            path.join(sheetsDir, 'Progenics pricelist(Final_pricelist).xlsx'),
            'lims_price_list',
            {
                'Service ID': 'service_id',
                'Service Name': 'service_name',
                'Category': 'category',
                'Base Price': 'base_price',
                'Discount': 'discount',
                'Tax Rate': 'tax_rate',
                'Final Price': 'final_price',
                'Effective Date': 'effective_date'
            }
        );

        // Import Daily Client Report Data
        await importExcelData(
            path.join(sheetsDir, 'Daily Client Report.xlsx'),
            'lims_daily_client_report',
            {
                'Report Date': 'report_date',
                'Client ID': 'client_id',
                'Sample Count': 'sample_count',
                'Tests Performed': 'tests_performed',
                'Status Summary': 'status_summary',
                'Issues': 'issues',
                'Actions Taken': 'actions_taken',
                'Next Steps': 'next_steps'
            }
        );

        // Import Lab Report Clinical Data
        await importExcelData(
            path.join(sheetsDir, 'Lab_Report sheet_(Clinical samples).xlsx'),
            'lims_lab_report_clinical',
            {
                'Report ID': 'report_id',
                'Sample ID': 'sample_id',
                'Patient ID': 'patient_id',
                'Test Results': 'test_results',
                'Reference Range': 'reference_range',
                'Interpretation': 'interpretation',
                'Report Date': 'report_date',
                'Pathologist': 'pathologist',
                'Verification Status': 'verification_status'
            }
        );

        console.log('Data import completed');
    } catch (error) {
        console.error('Error during import:', error);
        throw error;
    } finally {
        // Always re-enable foreign key checks, even if there was an error
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        // Close the connection pool
        await pool.end();
    }
}

// Start the import process
importAllData().catch(async (error) => {
    console.error('Fatal error:', error);
    // Make sure to re-enable foreign key checks and close pool on fatal errors
    try {
        await pool.query('SET FOREIGN_KEY_CHECKS = 1');
        await pool.end();
    } catch (err) {
        console.error('Error while cleaning up:', err);
    }
    process.exit(1);
});

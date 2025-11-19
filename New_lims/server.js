require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err.message);
    });

// Auth Routes
// API Routes for Lead Management
app.get('/api/leads', requireAuth, async (req, res) => {
    try {
        const [leads] = await pool.query(`
            SELECT 
                id,
                company_name,
                contact_person,
                email,
                phone,
                location,
                lead_source,
                lead_status,
                remarks,
                created_at,
                updated_at
            FROM lims_lead_details 
            ORDER BY created_at DESC
        `);
        res.json(leads);
    } catch (error) {
        console.error('Error fetching leads:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/leads', requireAuth, async (req, res) => {
    try {
        const { 
            company_name, 
            contact_person, 
            email, 
            phone, 
            location, 
            lead_source, 
            lead_status = 'New', 
            remarks 
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO lims_lead_details 
            (company_name, contact_person, email, phone, location, lead_source, lead_status, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [company_name, contact_person, email, phone, location, lead_source, lead_status, remarks]
        );
        
        // Fetch the newly created lead
        const [newLead] = await pool.query(
            'SELECT * FROM lims_lead_details WHERE id = ?',
            [result.insertId]
        );
        
        res.json({
            success: true,
            message: 'Lead created successfully',
            lead: newLead[0]
        });
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific lead
app.get('/api/leads/:id', requireAuth, async (req, res) => {
    try {
        const [leads] = await pool.query(
            'SELECT * FROM lims_lead_details WHERE id = ?',
            [req.params.id]
        );
        
        if (leads.length === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }
        
        res.json(leads[0]);
    } catch (error) {
        console.error('Error fetching lead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a lead
app.put('/api/leads/:id', requireAuth, async (req, res) => {
    try {
        const { 
            company_name, 
            contact_person, 
            email, 
            phone, 
            location, 
            lead_source, 
            lead_status, 
            remarks 
        } = req.body;

        const [result] = await pool.query(
            `UPDATE lims_lead_details 
             SET company_name = ?, 
                 contact_person = ?, 
                 email = ?, 
                 phone = ?, 
                 location = ?, 
                 lead_source = ?, 
                 lead_status = ?, 
                 remarks = ?,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [company_name, contact_person, email, phone, location, lead_source, lead_status, remarks, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Fetch the updated lead
        const [updatedLead] = await pool.query(
            'SELECT * FROM lims_lead_details WHERE id = ?',
            [req.params.id]
        );

        res.json({
            success: true,
            message: 'Lead updated successfully',
            lead: updatedLead[0]
        });
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a lead
app.delete('/api/leads/:id', requireAuth, async (req, res) => {
    try {
        const [result] = await pool.query(
            'DELETE FROM lims_lead_details WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        res.json({
            success: true,
            message: 'Lead deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Sample Management Routes
app.get('/api/samples', requireAuth, async (req, res) => {
    try {
        const [samples] = await pool.query(`
            SELECT s.*, l.company_name, l.contact_person, l.email, l.phone
            FROM lims_sample_details s
            LEFT JOIN lims_lead_details l ON s.lead_id = l.id
            ORDER BY s.created_at DESC
        `);
        res.json(samples);
    } catch (error) {
        console.error('Error fetching samples:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/samples', requireAuth, async (req, res) => {
    try {
        const {
            lead_id,
            sample_type,
            status,
            remarks,
            company_name,
            contact_person,
            email,
            phone
        } = req.body;

        const [result] = await pool.query(
            `INSERT INTO lims_sample_details 
            (lead_id, sample_type, status, remarks, company_name, contact_person, email, phone) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [lead_id, sample_type, status, remarks, company_name, contact_person, email, phone]
        );

        const [newSample] = await pool.query(
            'SELECT * FROM lims_sample_details WHERE id = ?',
            [result.insertId]
        );

        res.json({
            success: true,
            message: 'Sample created successfully',
            sample: newSample[0]
        });
    } catch (error) {
        console.error('Error creating sample:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API Routes for Sample Management
app.get('/api/samples/:type', requireAuth, async (req, res) => {
    try {
        const { type } = req.params;
        let table = type === 'clinical' ? 'lims_clinical_samples' : 'lims_discovery_samples';
        const [samples] = await pool.query(`SELECT * FROM ${table} ORDER BY received_date DESC`);
        res.json(samples);
    } catch (error) {
        console.error('Error fetching samples:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/samples/:type', requireAuth, async (req, res) => {
    try {
        const { type } = req.params;
        let table = type === 'clinical' ? 'lims_clinical_samples' : 'lims_discovery_samples';
        const { sample_id, patient_id, sample_type, collection_date, test_name, processing_status } = req.body;
        
        const [result] = await pool.query(
            `INSERT INTO ${table} (sample_id, patient_id, sample_type, collection_date, test_name, processing_status) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [sample_id, patient_id, sample_type, collection_date, test_name, processing_status]
        );
        res.json({ id: result.insertId, message: 'Sample created successfully' });
    } catch (error) {
        console.error('Error creating sample:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API Routes for Reports
app.get('/api/reports/:type', requireAuth, async (req, res) => {
    try {
        const { type } = req.params;
        let table;
        switch (type) {
            case 'daily':
                table = 'lims_daily_client_report';
                break;
            case 'financial':
                table = 'lims_finance';
                break;
            default:
                return res.status(400).json({ error: 'Invalid report type' });
        }
        const [reports] = await pool.query(`SELECT * FROM ${table} ORDER BY created_at DESC`);
        res.json(reports);
    } catch (error) {
        console.error('Error fetching reports:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Dashboard Statistics
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
    try {
        const [[leadCount]] = await pool.query('SELECT COUNT(*) as count FROM lims_lead_details');
        const [[clinicalCount]] = await pool.query('SELECT COUNT(*) as count FROM lims_clinical_samples');
        const [[discoveryCount]] = await pool.query('SELECT COUNT(*) as count FROM lims_discovery_samples');
        const [[revenue]] = await pool.query('SELECT SUM(total_amount) as total FROM lims_finance');
        
        res.json({
            totalLeads: leadCount.count,
            clinicalSamples: clinicalCount.count,
            discoverySamples: discoveryCount.count,
            totalRevenue: revenue.total || 0
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // For development: log the login attempt
        console.log('Login attempt:', { username });
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // First, create a new hash for testing
        const testHash = await bcrypt.hash(password, 10);
        console.log('Test hash generated:', testHash);

        // Query the database
        const [users] = await pool.query(
            'SELECT * FROM lims_users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Verify password hash
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        // For development: temporarily allow password 'admin123'
        if (password === 'admin123') {
            // Update the stored hash
            await pool.query(
                'UPDATE lims_users SET password = ? WHERE id = ?',
                [testHash, user.id]
            );
            
            req.session.user = {
                id: user.id,
                username: user.username,
                role: user.role
            };
            
            return res.json({ 
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            });
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Store user in session
        req.session.user = {
            id: user.id,
            username: user.username,
            role: user.role
        };

        res.json({ 
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

// Main Routes - Require Authentication
app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
// Lead Management
app.get('/api/leads', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM lims_lead_details ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/leads', async (req, res) => {
    try {
        const { company_name, contact_person, designation, email, phone, location, lead_source, lead_status, remarks } = req.body;
        const [result] = await pool.query(
            'INSERT INTO lims_lead_details (company_name, contact_person, designation, email, phone, location, lead_source, lead_status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [company_name, contact_person, designation, email, phone, location, lead_source, lead_status, remarks]
        );
        res.json({ id: result.insertId, message: 'Lead created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Clinical Samples
app.get('/api/clinical-samples', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM lims_clinical_samples ORDER BY received_date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clinical-samples', async (req, res) => {
    try {
        const { sample_id, patient_id, sample_type, collection_date, received_date, test_name, processing_status, qc_status, remarks } = req.body;
        const [result] = await pool.query(
            'INSERT INTO lims_clinical_samples (sample_id, patient_id, sample_type, collection_date, received_date, test_name, processing_status, qc_status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [sample_id, patient_id, sample_type, collection_date, received_date, test_name, processing_status, qc_status, remarks]
        );
        res.json({ id: result.insertId, message: 'Clinical sample created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Discovery Samples
app.get('/api/discovery-samples', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM lims_discovery_samples ORDER BY received_date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/discovery-samples', async (req, res) => {
    try {
        const { sample_id, client_id, sample_type, received_date, test_required, processing_status, qc_status, remarks } = req.body;
        const [result] = await pool.query(
            'INSERT INTO lims_discovery_samples (sample_id, client_id, sample_type, received_date, test_required, processing_status, qc_status, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [sample_id, client_id, sample_type, received_date, test_required, processing_status, qc_status, remarks]
        );
        res.json({ id: result.insertId, message: 'Discovery sample created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lab Raw Data
app.get('/api/lab-raw-data', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM lims_lab_raw_data ORDER BY experiment_date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/lab-raw-data', async (req, res) => {
    try {
        const { sample_id, experiment_id, experiment_date, raw_data_location, instrument_used, operator, data_type, quality_score, storage_location, backup_status } = req.body;
        const [result] = await pool.query(
            'INSERT INTO lims_lab_raw_data (sample_id, experiment_id, experiment_date, raw_data_location, instrument_used, operator, data_type, quality_score, storage_location, backup_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [sample_id, experiment_id, experiment_date, raw_data_location, instrument_used, operator, data_type, quality_score, storage_location, backup_status]
        );
        res.json({ id: result.insertId, message: 'Lab raw data created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Finance
app.get('/api/finance', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM lims_finance ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/finance', async (req, res) => {
    try {
        const { invoice_number, client_id, service_type, amount, tax_amount, total_amount, payment_status, payment_date, payment_method, remarks } = req.body;
        const [result] = await pool.query(
            'INSERT INTO lims_finance (invoice_number, client_id, service_type, amount, tax_amount, total_amount, payment_status, payment_date, payment_method, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [invoice_number, client_id, service_type, amount, tax_amount, total_amount, payment_status, payment_date, payment_method, remarks]
        );
        res.json({ id: result.insertId, message: 'Finance record created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inside Sales
app.get('/api/inside-sales', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM lims_inside_sales ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inside-sales', async (req, res) => {
    try {
        const { lead_id, sales_person, product_service, quotation_amount, proposal_sent_date, follow_up_date, probability_percentage, status, next_action, remarks } = req.body;
        const [result] = await pool.query(
            'INSERT INTO lims_inside_sales (lead_id, sales_person, product_service, quotation_amount, proposal_sent_date, follow_up_date, probability_percentage, status, next_action, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [lead_id, sales_person, product_service, quotation_amount, proposal_sent_date, follow_up_date, probability_percentage, status, next_action, remarks]
        );
        res.json({ id: result.insertId, message: 'Sales record created successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

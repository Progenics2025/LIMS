import mysql from 'mysql2/promise';
import 'dotenv/config';

async function initializeDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.29.12',
    user: process.env.DB_USER || 'remote_user',
    password: process.env.DB_PASSWORD || 'Prolab#05',
    port: parseInt(process.env.DB_PORT || '3306'),
  });

  try {
    // Create database
    await connection.execute(`CREATE DATABASE IF NOT EXISTS leadlab_lims`);
    console.log('✅ Database created or already exists');
    
    // Use the database
    await connection.execute(`USE leadlab_lims`);
    
    // Create tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL
      )`,
      `CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(36) PRIMARY KEY,
        organization VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        referred_doctor VARCHAR(255) NOT NULL,
        clinic_hospital_name VARCHAR(255) NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255) NOT NULL,
        client_email VARCHAR(255) NOT NULL,
        test_name VARCHAR(255) NOT NULL,
        sample_type VARCHAR(255) NOT NULL,
        amount_quoted DECIMAL(10,2) NOT NULL,
        tat INT NOT NULL,
        status VARCHAR(50) DEFAULT 'cold',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(36) NULL,
        converted_at TIMESTAMP NULL
      )`,
      `CREATE TABLE IF NOT EXISTS samples (
        id VARCHAR(36) PRIMARY KEY,
        sample_id VARCHAR(64) NOT NULL UNIQUE,
        lead_id VARCHAR(36) NOT NULL,
        status VARCHAR(50) DEFAULT 'pickup_scheduled',
        courier_details JSON NULL,
        amount DECIMAL(10,2) NOT NULL,
        paid_amount DECIMAL(10,2) DEFAULT '0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS lab_processing (
        id VARCHAR(36) PRIMARY KEY,
        sample_id VARCHAR(36) NOT NULL,
        lab_id VARCHAR(100) NOT NULL,
        qc_status VARCHAR(100) NULL,
        dna_rna_quantity DECIMAL(8,2) NULL,
        run_id VARCHAR(100) NULL,
        library_prepared BOOLEAN DEFAULT FALSE,
        sequencing_id VARCHAR(100) NULL,
        is_outsourced BOOLEAN DEFAULT FALSE,
        outsource_details JSON NULL,
        processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_by VARCHAR(36) NULL
      )`,
      `CREATE TABLE IF NOT EXISTS reports (
        id VARCHAR(36) PRIMARY KEY,
        sample_id VARCHAR(36) NOT NULL,
        status VARCHAR(50) DEFAULT 'in_progress',
        report_path VARCHAR(500) NULL,
        generated_at TIMESTAMP NULL,
        approved_at TIMESTAMP NULL,
        approved_by VARCHAR(36) NULL,
        delivered_at TIMESTAMP NULL
      )`,
      `CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        related_id VARCHAR(36) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await connection.execute(table);
    }
    
    console.log('✅ All tables created successfully');
    
    // Create indexes
    const indexes = [
      `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
      `CREATE INDEX IF NOT EXISTS idx_samples_lead_id ON samples(lead_id)`,
      `CREATE INDEX IF NOT EXISTS idx_reports_sample_id ON reports(sample_id)`,
      `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`
    ];

    for (const index of indexes) {
      try {
        await connection.execute(index);
      } catch (e) {
        // Index might already exist, ignore error
      }
    }
    
    console.log('✅ Database initialization complete!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  } finally {
    await connection.end();
  }
}

initializeDatabase();
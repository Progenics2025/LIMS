// Create missing finance_records table
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function createFinanceTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.29.12',
    user: process.env.DB_USER || 'remote_user', 
    password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
    database: process.env.DB_NAME || 'leadlab_lims',
  });

  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS finance_records (
      id VARCHAR(36) PRIMARY KEY,
      sample_id VARCHAR(36),
      lead_id VARCHAR(36),
      invoice_number VARCHAR(100) UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) NOT NULL,
      payment_status VARCHAR(50) DEFAULT 'pending',
      payment_method VARCHAR(50),
      payment_date TIMESTAMP NULL,
      due_date TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      currency VARCHAR(10) DEFAULT 'INR',
      discount_amount DECIMAL(10,2) DEFAULT 0,
      discount_reason VARCHAR(255),
      billing_address TEXT,
      billing_contact VARCHAR(255),
      payment_terms VARCHAR(100),
      late_fees DECIMAL(10,2) DEFAULT 0,
      refund_amount DECIMAL(10,2) DEFAULT 0,
      refund_reason VARCHAR(255),
      notes TEXT
    );
  `;

  try {
    await connection.execute(createTableSQL);
    console.log('✅ finance_records table created successfully');
  } catch (error) {
    console.error('❌ Failed to create finance_records table:', error);
  } finally {
    await connection.end();
  }
}

createFinanceTable().catch(console.error);
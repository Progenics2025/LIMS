import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const desired = [
  { name: 'title_unique_id', def: 'VARCHAR(100) NULL' },
  { name: 'date_sample_collected', def: 'TIMESTAMP NULL' },
  { name: 'organization', def: 'VARCHAR(255) NULL' },
  { name: 'clinician', def: 'VARCHAR(255) NULL' },
  { name: 'city', def: 'VARCHAR(255) NULL' },
  { name: 'patient_name', def: 'VARCHAR(255) NULL' },
  { name: 'patient_email', def: 'VARCHAR(255) NULL' },
  { name: 'patient_phone', def: 'VARCHAR(50) NULL' },
  { name: 'service_name', def: 'VARCHAR(255) NULL' },
  { name: 'budget', def: 'DECIMAL(10,2) NULL' },
  { name: 'sales_responsible_person', def: 'VARCHAR(255) NULL' },
  { name: 'invoice_amount', def: 'DECIMAL(10,2) NULL' },
  { name: 'invoice_date', def: 'TIMESTAMP NULL' },
  { name: 'payment_received_amount', def: 'DECIMAL(10,2) NULL' },
  { name: 'utr_details', def: 'VARCHAR(255) NULL' },
  { name: 'balance_amount_received_date', def: 'TIMESTAMP NULL' },
  { name: 'total_payment_received_status', def: 'VARCHAR(100) NULL' },
  { name: 'phlebotomist_charges', def: 'DECIMAL(10,2) NULL' },
  { name: 'sample_shipment_amount', def: 'DECIMAL(10,2) NULL' },
  { name: 'third_party_charges', def: 'DECIMAL(10,2) NULL' },
  { name: 'other_charges', def: 'DECIMAL(10,2) NULL' },
  { name: 'third_party_name', def: 'VARCHAR(255) NULL' },
  { name: 'third_party_contract_details', def: 'TEXT NULL' },
  { name: 'third_party_payment_status', def: 'VARCHAR(100) NULL' },
  { name: 'progenics_trf', def: 'VARCHAR(255) NULL' },
  { name: 'approve_to_lab_process', def: 'BOOLEAN DEFAULT FALSE' },
  { name: 'approve_to_report_process', def: 'BOOLEAN DEFAULT FALSE' },
  { name: 'created_by', def: 'VARCHAR(36) NULL' }
];

async function main(){
  const config = {
    host: process.env.DB_HOST || '192.168.29.12',
    user: process.env.DB_USER || 'remote_user',
    password: process.env.DB_PASSWORD ? (process.env.DB_PASSWORD.includes('%') ? decodeURIComponent(process.env.DB_PASSWORD) : process.env.DB_PASSWORD) : 'Prolab%2305',
    database: process.env.DB_NAME || 'leadlab_lims'
  };
  console.log('Connecting to DB', { host: config.host, user: config.user, database: config.database });
  const conn = await mysql.createConnection(config);
  for(const col of desired){
    try{
      const [[{ cnt }]] = await conn.query(
        `SELECT COUNT(*) as cnt FROM information_schema.columns WHERE table_schema = ? AND table_name = 'finance_records' AND column_name = ?`,
        [config.database, col.name]
      );
      if(Number(cnt) === 0){
        const sql = 'ALTER TABLE finance_records ADD COLUMN `' + col.name + '` ' + col.def;
        console.log('Adding column:', col.name);
        await conn.execute(sql);
      } else {
        console.log('Column exists, skipping:', col.name);
      }
    }catch(err){
      console.error('Error checking/adding column', col.name, err.message);
    }
  }
  await conn.end();
  console.log('Finished ensuring finance columns');
}

main().catch(err=>{ console.error(err); process.exit(1); });

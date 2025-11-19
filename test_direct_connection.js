import mysql from 'mysql2/promise';
import 'dotenv/config';

async function testConnection() {
  console.log('Testing direct MySQL connection...');
  console.log('DB_HOST:', process.env.DB_HOST);
  console.log('DB_USER:', process.env.DB_USER);
  console.log('DB_NAME:', process.env.DB_NAME);
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '192.168.29.12',
      user: process.env.DB_USER || 'remote_user', 
      password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
      database: process.env.DB_NAME || 'leadlab_lims',
      port: parseInt(process.env.DB_PORT || '3306'),
      ssl: false,
      connectTimeout: 60000,
    });

    console.log('✅ Connection successful!');
    
    // Test a simple query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log('✅ Query successful:', rows);
    
    // Check leads table structure
    const [leadsStructure] = await connection.execute('DESCRIBE leads');
    console.log('\n📋 Leads table structure:');
    leadsStructure.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type}`);
    });
    
    // Check samples table structure
    const [samplesStructure] = await connection.execute('DESCRIBE samples');
    console.log('\n📋 Samples table structure:');
    samplesStructure.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type}`);
    });
    
    // Check reports table structure
    const [reportsStructure] = await connection.execute('DESCRIBE reports');
    console.log('\n📋 Reports table structure:');
    reportsStructure.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type}`);
    });
    
    // Check lab_processing table structure
    const [labStructure] = await connection.execute('DESCRIBE lab_processing');
    console.log('\n📋 Lab Processing table structure:');
    labStructure.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type}`);
    });
    
    await connection.end();
    console.log('✅ Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
  }
}

testConnection();
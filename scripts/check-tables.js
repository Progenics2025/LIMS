// Check database structure for samples table
import mysql from 'mysql2/promise';
import 'dotenv/config';

async function checkTableStructure() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.29.12',
    user: process.env.DB_USER || 'remote_user', 
    password: decodeURIComponent(process.env.DB_PASSWORD || 'Prolab%2305'),
    database: process.env.DB_NAME || 'leadlab_lims',
  });

  try {
    console.log('🔍 Checking samples table structure...');
    const [samplesRows] = await connection.execute('DESCRIBE samples');
    console.log('Samples table columns:', samplesRows);
    
    console.log('\n🔍 Checking finance_records table structure...');
    const [financeRows] = await connection.execute('DESCRIBE finance_records');
    console.log('Finance records table columns:', financeRows);
    
    console.log('\n🔍 Checking reports table structure...');
    const [reportsRows] = await connection.execute('DESCRIBE reports');
    console.log('Reports table columns:', reportsRows);
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error);
  } finally {
    await connection.end();
  }
}

checkTableStructure().catch(console.error);
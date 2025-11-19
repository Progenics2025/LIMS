// Test script to debug database connection
import 'dotenv/config';
import mysql from 'mysql2/promise';

console.log('Testing database connection...');
console.log('Environment variables:');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);

async function testConnection() {
  try {
    console.log('\nAttempting to connect...');
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log('✅ Connection successful!');
    
    const [rows] = await connection.execute('SELECT "Connection test" as status');
    console.log('Query result:', rows);
    
    await connection.end();
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
    console.error('SQL State:', error.sqlState);
    console.error('Message:', error.message);
  }
}

testConnection();


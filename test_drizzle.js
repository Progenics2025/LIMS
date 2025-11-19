// Test Drizzle connection specifically
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';

console.log('Testing Drizzle connection...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

async function testDrizzle() {
  try {
    console.log('\nCreating connection pool...');
    const pool = mysql.createPool(process.env.DATABASE_URL);
    
    console.log('Creating Drizzle instance...');
    const db = drizzle(pool);
    
    console.log('Testing query...');
    const [rows] = await pool.execute('SELECT "Drizzle test" as status');
    console.log('✅ Query successful:', rows);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Drizzle connection failed:');
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
    console.error('SQL State:', error.sqlState);
    console.error('Message:', error.message);
    console.error('Full error:', error);
  }
}

testDrizzle();


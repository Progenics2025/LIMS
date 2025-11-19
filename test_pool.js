// Test connection pool with explicit parameters
import 'dotenv/config';
import mysql from 'mysql2/promise';

console.log('Testing connection pool with explicit parameters...');

async function testPool() {
  try {
    console.log('\nCreating connection pool with explicit config...');
    
    // Parse the DATABASE_URL manually
    const url = process.env.DATABASE_URL;
    console.log('URL:', url);
    
    // Extract components
    const match = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    const [, user, password, host, port, database] = match;
    console.log('Parsed components:');
    console.log('  User:', user);
    console.log('  Password:', password);
    console.log('  Host:', host);
    console.log('  Port:', port);
    console.log('  Database:', database);
    
    const config = {
      host,
      port: parseInt(port),
      user,
      password,
      database,
      ssl: false,
      connectTimeout: 60000,
      acquireTimeout: 60000,
      timeout: 60000,
      charset: 'utf8mb4'
    };
    
    console.log('\nCreating pool with config:', config);
    const pool = mysql.createPool(config);
    
    console.log('Testing query...');
    const [rows] = await pool.execute('SELECT "Pool test" as status');
    console.log('✅ Query successful:', rows);
    
    await pool.end();
  } catch (error) {
    console.error('❌ Pool connection failed:');
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
    console.error('SQL State:', error.sqlState);
    console.error('Message:', error.message);
    console.error('Full error:', error);
  }
}

testPool();


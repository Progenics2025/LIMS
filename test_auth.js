import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    try {
        const config = {
            host: process.env.DB_HOST || '192.168.29.12',
            user: process.env.DB_USER || 'remote_user',
            password: process.env.DB_PASSWORD || 'Prolab%2305',
            database: process.env.DB_NAME || 'leadlab_lims'
        };

        console.log('Attempting to connect with config:', {
            ...config,
            password: '****'
        });

        const connection = await mysql.createConnection(config);
        console.log('✅ Database connection successful');

        // Test users table
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        console.log('Users in database:', users[0].count);

        // Test user authentication
        const [userRows] = await connection.execute('DESCRIBE users');
        console.log('\nUsers table structure:', userRows.map(row => `${row.Field} (${row.Type})`));

        await connection.end();
    } catch (error) {
        console.error('Error:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage,
            stack: error.stack
        });
    }
}

testConnection();
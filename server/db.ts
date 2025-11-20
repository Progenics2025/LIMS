import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

// Parse DATABASE_URL or use explicit config
function getDbConfig() {
  // Use explicit config to avoid URL parsing issues
  const config = {
    host: process.env.DB_HOST || '192.168.29.11',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'remote_user',
    // allow percent-encoded passwords in env (e.g. Prolab%2305) and decode them
    password: process.env.DB_PASSWORD ? (process.env.DB_PASSWORD.includes('%') ? decodeURIComponent(process.env.DB_PASSWORD) : process.env.DB_PASSWORD) : 'Prolab#05',
    database: process.env.DB_NAME || 'leadlab_lims',
    ssl: false,
    connectTimeout: 60000,
    charset: 'utf8mb4'
  };
  console.log('Database config:', { ...config, password: '***' });
  return config;
}

const config = getDbConfig();
const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: undefined, // Remove SSL for local connections
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connection pool initialized successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Error initializing database connection pool:', {
      code: err.code,
      errno: err.errno,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    process.exit(1); // Exit if we can't connect to the database
  });

const db = drizzle(pool);

export { pool, db };


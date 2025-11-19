import fs from 'fs/promises';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function main(){
  try{
    const sql = await fs.readFile('./migrations/0009_add_finance_columns.sql', 'utf8');
    const config = {
      host: process.env.DB_HOST || '192.168.29.12',
      user: process.env.DB_USER || 'remote_user',
      password: process.env.DB_PASSWORD ? (process.env.DB_PASSWORD.includes('%') ? decodeURIComponent(process.env.DB_PASSWORD) : process.env.DB_PASSWORD) : 'Prolab%2305',
      database: process.env.DB_NAME || 'leadlab_lims',
      multipleStatements: true,
    };
    console.log('Connecting to DB', { host: config.host, user: config.user, database: config.database });
    const conn = await mysql.createConnection(config);
    const statements = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for(const stmt of statements){
      try{
        console.log('Running statement (first 200 chars):', stmt.slice(0,200).replace(/\n/g,' '));
        await conn.execute(stmt);
      }catch(err){
        console.error('Statement failed (continuing):', err.message);
      }
    }
    await conn.end();
    console.log('Migration applied (attempted)');
  }catch(err){
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

main();

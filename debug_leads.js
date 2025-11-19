#!/usr/bin/env node
/**
 * Debug script to check what's actually in the leads table
 */
import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  user: 'remote_user',
  password: 'Prolab%2305',
  database: 'leadlab_lims',
  port: 3306
};

async function debugLeads() {
  console.log('Connecting to database...');
  const conn = await mysql.createConnection(config);
  
  try {
    console.log('\n1) Sample of leads with test_name and service_name:');
    const [rows] = await conn.execute(`
      SELECT id, test_name, service_name, organization, status 
      FROM leads 
      LIMIT 10
    `);
    console.table(rows);
    
    console.log('\n2) Count of test_name values:');
    const [testCounts] = await conn.execute(`
      SELECT test_name, COUNT(*) as count 
      FROM leads 
      GROUP BY test_name 
      ORDER BY count DESC
      LIMIT 10
    `);
    console.table(testCounts);
    
    console.log('\n3) Count of service_name values:');
    const [serviceCounts] = await conn.execute(`
      SELECT service_name, COUNT(*) as count 
      FROM leads 
      GROUP BY service_name 
      ORDER BY count DESC
      LIMIT 10
    `);
    console.table(serviceCounts);
    
    console.log('\n4) Leads with "Unknown Test" in test_name:');
    const [unknownTests] = await conn.execute(`
      SELECT id, test_name, service_name, organization 
      FROM leads 
      WHERE test_name = 'Unknown Test' 
      LIMIT 5
    `);
    console.table(unknownTests);
    
  } finally {
    await conn.end();
  }
}

debugLeads().catch(console.error);
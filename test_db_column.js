import mysql from 'mysql2/promise';

async function testDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: '192.168.29.12',
      port: 3306,
      user: 'remote_user',
      password: 'Prolab#05',
      database: 'leadlab_lims'
    });

    console.log('Connected to database successfully!');
    
    // Check if the column exists
    const [rows] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'leadlab_lims' 
      AND TABLE_NAME = 'lab_processing' 
      AND COLUMN_NAME = 'approved_to_bioinformatics'
    `);
    
    if (rows.length > 0) {
      console.log('✅ approved_to_bioinformatics column exists:', rows[0]);
    } else {
      console.log('❌ approved_to_bioinformatics column not found');
    }
    
    await connection.end();
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}

testDatabase();
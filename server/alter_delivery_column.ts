import { pool } from './db';

async function run() {
    try {
        console.log('Altering table lead_management...');
        // Modify the column to VARCHAR(255) and allow NULLs (as per schema definition)
        await pool.query('ALTER TABLE lead_management MODIFY COLUMN delivery_up_to VARCHAR(255) NULL');
        console.log('✅ Successfully altered column delivery_up_to to VARCHAR(255)');
    } catch (error) {
        console.error('❌ Error altering table:', error);
    } finally {
        await pool.end();
        process.exit();
    }
}

run();

/**
 * Migration script to update old shortened service names to full names
 * Run this with: node scripts/migrate-service-names.mjs
 */

import mysql from 'mysql2/promise';

const serviceNameMigration = {
    'Sanger Clinical': 'Sanger Sequencing - Clinical',
    'Sanger Discovery': 'Sanger Sequencing - Discovery',
    'WGS': 'Whole Genome Sequencing',
    'Targeted Amplicons': 'Targeted Amplicons Sequencing',
    'Shotgun': 'Shotgun Metagenomics Sequencing',
    'WES+ Mito': 'WES+Mito'
};

async function migrateServiceNames() {
    console.log('🔄 Attempting to connect to database...');

    // Try localhost first (if database is on same machine)
    let connection;
    try {
        connection = await mysql.createConnection({
            host: 'localhost',
            port: 3306,
            user: 'remote_user',
            password: 'Prolab#05',
            database: 'lead_lims2'
        });
        console.log('✅ Connected to database via localhost\n');
    } catch (err) {
        console.log('⚠️  localhost connection failed, trying remote IP...');
        try {
            connection = await mysql.createConnection({
                host: '192.168.29.11',
                port: 3306,
                user: 'remote_user',
                password: 'Prolab#05',
                database: 'lead_lims2',
                connectTimeout: 10000
            });
            console.log('✅ Connected to database via 192.168.29.11\n');
        } catch (err2) {
            console.error('❌ Could not connect to database');
            console.error('Tried localhost and 192.168.29.11');
            console.error('Error:', err2.message);
            throw err2;
        }
    }

    console.log('🔄 Starting service name migration...\n');

    let totalUpdated = 0;

    try {
        for (const [oldName, newName] of Object.entries(serviceNameMigration)) {
            console.log(`📝 Migrating "${oldName}" → "${newName}"`);

            // Update all leads with the old service name
            const [result] = await connection.execute(
                'UPDATE lead_management SET service_name = ? WHERE service_name = ?',
                [newName, oldName]
            );

            const updated = result.affectedRows;
            totalUpdated += updated;

            if (updated > 0) {
                console.log(`   ✅ Updated ${updated} record(s)`);
            } else {
                console.log(`   ℹ️  No records found`);
            }
        }

        console.log(`\n✅ Migration complete! Total records updated: ${totalUpdated}`);

        // Show current service name distribution
        console.log('\n📊 Current service name distribution:');
        const [rows] = await connection.execute(
            'SELECT service_name, COUNT(*) as count FROM lead_management GROUP BY service_name ORDER BY service_name'
        );
        console.table(rows);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

// Run the migration
migrateServiceNames()
    .then(() => {
        console.log('\n✅ All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    });

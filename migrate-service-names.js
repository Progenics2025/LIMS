/**
 * Migration script to update old shortened service names to full names
 * Run this with: node migrate-service-names.js
 */

import { db } from './server/db.js';
import { leads } from './shared/schema.js';
import { eq, or } from 'drizzle-orm';

const serviceNameMigration = {
    'Sanger Clinical': 'Sanger Sequencing - Clinical',
    'Sanger Discovery': 'Sanger Sequencing - Discovery',
    'WGS': 'Whole Genome Sequencing',
    'Targeted Amplicons': 'Targeted Amplicons Sequencing',
    'Shotgun': 'Shotgun Metagenomics Sequencing',
    'WES+ Mito': 'WES+Mito'
};

async function migrateServiceNames() {
    console.log('🔄 Starting service name migration...');

    let totalUpdated = 0;

    for (const [oldName, newName] of Object.entries(serviceNameMigration)) {
        try {
            console.log(`\n📝 Migrating "${oldName}" → "${newName}"`);

            // Find all leads with the old service name
            const leadsToUpdate = await db
                .select()
                .from(leads)
                .where(eq(leads.serviceName, oldName));

            console.log(`   Found ${leadsToUpdate.length} records to update`);

            if (leadsToUpdate.length > 0) {
                // Update each lead
                for (const lead of leadsToUpdate) {
                    await db
                        .update(leads)
                        .set({ serviceName: newName })
                        .where(eq(leads.id, lead.id));
                }

                totalUpdated += leadsToUpdate.length;
                console.log(`   ✅ Updated ${leadsToUpdate.length} records`);
            }
        } catch (error) {
            console.error(`   ❌ Error migrating "${oldName}":`, error.message);
        }
    }

    console.log(`\n✅ Migration complete! Total records updated: ${totalUpdated}`);
    process.exit(0);
}

// Run the migration
migrateServiceNames().catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
});

import { db } from './server/db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    const user = await db.select().from(users).where(eq(users.email, 'digitalsales@progenicslabs.com'));
    console.log('User found:', user);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

main();

import { pool } from '../db';

/**
 * Project ID Format: PREFIXYYMMDDHHMMSS
 * 
 * Example: PG250120142530 (Production/Discovery project on Jan 20, 2025 at 14:25:30)
 * 
 * Prefix Mapping:
 * - PG: Production/Discovery projects
 * - DG: Discovery projects (alternative)
 * - CL: Clinical projects
 * 
 * Format breakdown:
 * - PREFIX (2 chars): PG (Production) or CL (Clinical)
 * - YY (2 chars): Last two digits of year (e.g., 25)
 * - MM (2 chars): Month with leading zero (e.g., 01-12)
 * - DD (2 chars): Day with leading zero (e.g., 01-31)
 * - HH (2 chars): Hour with leading zero (e.g., 00-23)
 * - MM (2 chars): Minute with leading zero (e.g., 00-59)
 * - SS (2 chars): Second with leading zero (e.g., 00-59)
 */

/**
 * Pads a number with a leading zero if it's single digit
 */
function padZero(num: number): string {
  return String(num).padStart(2, '0');
}

/**
 * Determines the prefix based on lead category
 */
function getPrefix(category: string): string {
  const cat = category?.toLowerCase().trim();
  
  if (cat === 'discovery' || cat === 'dg') {
    return 'DG';  // Discovery projects
  } else if (cat === 'clinical' || cat === 'pg') {
    return 'PG';  // Clinical/Production projects
  }
  
  // Default to PG (Clinical/Production)
  return 'PG';
}

/**
 * Generates a timestamp portion of the ID
 * Format: YYMMDDHHMMSS
 */
function generateTimestamp(): string {
  const now = new Date();
  
  const yy = padZero(now.getFullYear() % 100);  // Last 2 digits of year
  const mm = padZero(now.getMonth() + 1);       // Month (01-12)
  const dd = padZero(now.getDate());             // Day (01-31)
  const hh = padZero(now.getHours());            // Hour (00-23)
  const min = padZero(now.getMinutes());         // Minute (00-59)
  const ss = padZero(now.getSeconds());          // Second (00-59)
  
  return `${yy}${mm}${dd}${hh}${min}${ss}`;
}

/**
 * Checks if a project ID already exists in the database
 */
async function projectIdExists(projectId: string): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    try {
      // Check in leads table (assuming project_id column exists)
      const [rows] = await connection.query(
        'SELECT id FROM lead_management WHERE id = ? LIMIT 1',
        [projectId]
      );
      
      if (Array.isArray(rows) && rows.length > 0) {
        return true;
      }
      
      // Also check in lead_management if it exists
      try {
        const [projRows] = await connection.query(
          'SELECT id FROM lead_management WHERE id = ? LIMIT 1',
          [projectId]
        );
        return Array.isArray(projRows) && projRows.length > 0;
      } catch {
        // lead_management table might not exist, continue
        return false;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error checking if project ID exists:', error);
    return false;
  }
}

/**
 * Waits for a specified number of milliseconds
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates a unique Project ID with retry logic
 * 
 * Logic:
 * 1. Determine prefix based on category (Clinical=CL, Discovery=DG)
 * 2. Generate timestamp (YY-MM-DD-HH-MM-SS)
 * 3. Combine to form ID (e.g., CL250120142530)
 * 4. Check if ID exists in database
 * 5. If exists: Wait 1 second, regenerate timestamp, check again
 * 6. If unique: Return the ID
 * 
 * Max attempts: 10 (extremely unlikely to need more than 1)
 */
export async function generateProjectId(category: string): Promise<string> {
  const prefix = getPrefix(category);
  
  const maxAttempts = 10;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    // Generate the timestamp-based ID
    const timestamp = generateTimestamp();
    const projectId = `${prefix}${timestamp}`;
    
    // Check if it already exists
    const exists = await projectIdExists(projectId);
    
    if (!exists) {
      console.log(`✓ Generated unique project ID: ${projectId} (attempt ${attempts + 1})`);
      return projectId;
    }
    
    // ID collision detected (extremely rare), wait and retry
    attempts++;
    console.warn(`⚠ Project ID collision detected: ${projectId} (attempt ${attempts}/${maxAttempts})`);
    
    if (attempts < maxAttempts) {
      // Wait 1 second before retrying
      await sleep(1000);
      console.log(`Retrying in 1 second... (attempt ${attempts + 1}/${maxAttempts})`);
    }
  }
  
  // Fallback (should almost never happen)
  // Generate with additional milliseconds for uniqueness
  const timestamp = generateTimestamp();
  const ms = String(Date.now() % 1000).padStart(3, '0');
  const fallbackId = `${prefix}${timestamp}${ms.slice(0, 2)}`;
  
  console.warn(`⚠ Max attempts reached, using fallback ID: ${fallbackId}`);
  return fallbackId;
}

/**
 * Synchronous version for compatibility (WITHOUT DB check)
 * WARNING: This does not verify uniqueness in the database
 * Use the async version for safety
 */
export function generateProjectIdSync(category: string): string {
  const prefix = getPrefix(category);
  const timestamp = generateTimestamp();
  return `${prefix}${timestamp}`;
}

export default generateProjectId;

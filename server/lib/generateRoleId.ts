import { pool } from '../db';

// Map roles to short codes
const roleMap: Record<string, string> = {
  administration: 'AD',
  admin: 'AD',
  manager: 'MG',
  discovery: 'DG',
  production: 'PG',
  finance: 'FN',
  hr: 'HR'
};

/**
 * Characters for random suffix generation
 * Excludes ambiguous characters: I, L, O (commonly confused with 1, 1, 0)
 */
const SAFE_CHARS = '0123456789ABCDEFGHJKMNPQRSTUVWXYZ'; // Removed I, L, O

/**
 * Generates a random string of specified length using safe characters
 */
function generateRandomSuffix(length: number = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += SAFE_CHARS.charAt(Math.floor(Math.random() * SAFE_CHARS.length));
  }
  return result;
}

/**
 * Checks if a unique ID already exists in the database
 */
async function idExists(uniqueId: string): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT id FROM lead_management WHERE unique_id = ? LIMIT 1',
        [uniqueId]
      );
      return Array.isArray(rows) && rows.length > 0;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error checking if ID exists:', error);
    // If we can't check, return false and let the database constraint handle it
    return false;
  }
}

/**
 * Generates a unique Lead ID with the format: YYROLLSUFFIX
 * Example: 25AD7G3X9P
 * 
 * Format breakdown:
 * - YY: Last two digits of current year (e.g., 25)
 * - ROLE: Two-letter role code (e.g., AD for Admin)
 * - SUFFIX: Random 6-character alphanumeric (e.g., 7G3X9P)
 * 
 * The function includes a "safety net" that checks for uniqueness
 * before returning to ensure no duplicate IDs are generated.
 */
export async function generateRoleId(role: string): Promise<string> {
  const code = roleMap[role?.toLowerCase()] || (role ? role.substring(0, 2).toUpperCase() : 'AD');
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2); // last two digits (e.g., "25")

  // Generate ID with safety net
  let attempts = 0;
  const maxAttempts = 10; // Should rarely need more than 1 attempt with 2.1 billion possibilities

  while (attempts < maxAttempts) {
    const suffix = generateRandomSuffix(6);
    const uniqueId = `${yy}${code}${suffix}`;

    const exists = await idExists(uniqueId);
    if (!exists) {
      return uniqueId;
    }

    attempts++;
    console.warn(`Generated ID ${uniqueId} already exists, regenerating... (attempt ${attempts}/${maxAttempts})`);
  }

  // Fallback (should almost never happen): add timestamp
  const timestamp = Date.now().toString().slice(-6);
  return `${yy}${code}${timestamp}`;
}

/**
 * Synchronous version for backwards compatibility (without DB check)
 * WARNING: This does not check for uniqueness in the database
 */
export function generateRoleIdSync(role: string): string {
  const code = roleMap[role?.toLowerCase()] || (role ? role.substring(0, 2).toUpperCase() : 'AD');
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const suffix = generateRandomSuffix(6);
  return `${yy}${code}${suffix}`;
}

export default generateRoleId;

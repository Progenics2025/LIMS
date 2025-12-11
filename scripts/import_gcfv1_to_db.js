import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CSV = path.join(__dirname, '..', 'excel_files', 'GCF_V1 (1).csv');

const FIELD_MAP = {
  'unique id': 'unique_id',
  'created': 'created_at',
  "gc registration start time": 'gc_registration_start_time',
  "gc registration end time": 'gc_registration_end_time',
  "client's name": 'patient_client_name',
  "client's contact": 'patient_client_phone',
  "client's email id": 'patient_client_email',
  'age': 'age',
  'sex': 'gender',
  'payment status': 'payment_status',
  'mode of payment': 'mode_of_payment',
  'approval from head': 'approval_from_head',
  'referral doctor': 'clinician_researcher_name',
  'organisation': 'organisation_hospital',
  'speciality': 'speciality',
  'query': 'query_suspection',
  'gc name': 'gc_name',
  'gc other members': 'gc_other_members',
  'service name': 'service_name',
  'counseling type': 'counseling_type',
  'counseling start time': 'counseling_start_time',
  'counseling end time': 'counseling_end_time',
  'budget for test opted': 'budget_for_test_opted',
  'testing status': 'testing_status',
  'action required': 'action_required',
  'potential patient for testing in future': 'potential_patient_for_testing_in_future',
  'extended family testing requirement': 'extended_family_testing_requirement',
  'budget': 'budget',
  'sample type': 'sample_type',
  'created by': 'created_by',
  'gc summary sheet': 'gc_summary_sheet',
  'gcf_video inks': 'gc_video_link',
  'gcf_video inks': 'gc_video_link',
  'modified': 'modified_at',
  'assign to sales person': 'sales_responsible_person'
};

function normalizeHeader(h) {
  if (!h && h !== 0) return '';
  return String(h).trim().toLowerCase().replace(/\s+/g, ' ');
}

function parseBoolean(v) {
  if (v === null || v === undefined) return 0;
  const s = String(v).trim().toLowerCase();
  if (!s) return 0;
  if (['yes', 'y', 'true', '1', 'proceed'].includes(s)) return 1;
  return 0;
}

function parseNumber(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).replace(/[,₹Rs.\s]/g, '').trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isNaN(n) ? null : n;
}

function parseDateTime(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s) return null;
  // Try Date.parse
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const dt = new Date(parsed);
    // Convert to MySQL datetime format
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const d = String(dt.getDate()).padStart(2, '0');
    const hh = String(dt.getHours()).padStart(2, '0');
    const mm = String(dt.getMinutes()).padStart(2, '0');
    const ss = String(dt.getSeconds()).padStart(2, '0');
    return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
  }
  return null;
}

function parseTimeFromValue(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  // If full datetime, extract time
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const dt = new Date(parsed);
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}:00`;
  }
  // If it's already like '10:30 PM' or '22:30'
  // Try parsing with regex
  const hm = s.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/);
  if (hm) {
    let hh = Number(hm[1]);
    const mm = hm[2];
    const ap = hm[3];
    if (ap) {
      const apLow = ap.toLowerCase();
      if (apLow === 'pm' && hh < 12) hh += 12;
      if (apLow === 'am' && hh === 12) hh = 0;
    }
    return `${String(hh).padStart(2,'0')}:${mm}:00`;
  }
  return null;
}

function truncateIfNeeded(val, maxLen) {
  if (val == null || maxLen == null) return val;
  const s = String(val);
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen);
}

async function main() {
  const fileArg = process.argv[2] || DEFAULT_CSV;
  if (!fs.existsSync(fileArg)) {
    console.error('CSV file not found:', fileArg);
    process.exit(1);
  }

  const workbook = XLSX.readFile(fileArg, { raw: false, cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
  console.log('Rows read from CSV:', rows.length);

  // DB connection config: reuse environment or fallback to repo defaults if available
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'remote_user',
    password: process.env.DB_PASS || 'Prolab#05',
    database: process.env.DB_NAME || 'lead_lims2',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  const [colsRes] = await pool.query(
    `SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [process.env.DB_NAME || 'lead_lims2', 'genetic_counselling_records']
  );

  const dbColumns = {};
  for (const r of colsRes) {
    dbColumns[r.COLUMN_NAME] = {
      dataType: r.DATA_TYPE,
      maxLen: r.CHARACTER_MAXIMUM_LENGTH
    };
  }

  // Build mapping from csv header -> db column where available
  const firstRow = rows[0] || {};
  const csvHeaders = Object.keys(firstRow);
  const csvToDb = {};
  for (const h of csvHeaders) {
    const nh = normalizeHeader(h);
    if (FIELD_MAP[nh]) {
      const dbCol = FIELD_MAP[nh];
      if (dbColumns[dbCol]) csvToDb[h] = dbCol; // keep original header key
    }
  }

  console.log('Mapped CSV headers -> DB columns:', csvToDb);

  // Ensure unique_id exists in dbColumns
  if (!dbColumns['unique_id']) {
    console.error('Table genetic_counselling_records does not have unique_id column');
    process.exit(1);
  }

  let processed = 0, inserted = 0, updated = 0;

  for (const row of rows) {
    processed++;
    const out = {};

    // Map values
    for (const [csvHeader, dbCol] of Object.entries(csvToDb)) {
      let val = row[csvHeader];
      if (val === '') val = null;

      const colInfo = dbColumns[dbCol];
      if (!colInfo) continue;

      if (['date', 'datetime', 'timestamp'].includes(colInfo.dataType)) {
        const dt = parseDateTime(val);
        if (dt == null && val != null) {
          console.warn(`Warning: column '${dbCol}' expects datetime/date but value '${val}' could not be parsed; inserting NULL`);
        }
        out[dbCol] = dt;
        continue;
      }

      if (colInfo.dataType === 'time') {
        const t = parseTimeFromValue(val);
        if (t == null && val != null) {
          console.warn(`Warning: column '${dbCol}' expects time but value '${val}' could not be parsed; inserting NULL`);
        }
        out[dbCol] = t;
        continue;
      }

      if (['tinyint','bit'].includes(colInfo.dataType)) {
        out[dbCol] = parseBoolean(val);
        continue;
      }

      if (['int','bigint','smallint','mediumint'].includes(colInfo.dataType)) {
        const n = parseNumber(val);
        out[dbCol] = n == null ? null : Math.trunc(n);
        continue;
      }

      if (['decimal','double','float'].includes(colInfo.dataType)) {
        out[dbCol] = parseNumber(val);
        continue;
      }

      // Strings / text
      if (colInfo.maxLen) {
        out[dbCol] = truncateIfNeeded(val, colInfo.maxLen);
        if (val != null && String(val).length > colInfo.maxLen) {
          console.warn(`Warning: column '${dbCol}' max length ${colInfo.maxLen} exceeded; truncating value.`);
        }
      } else {
        out[dbCol] = val;
      }
    }

    // Fill required fields / transformations
    // unique_id MUST be present; generate if missing
    if (!out.unique_id) {
      const gen = `GC${Date.now()}${Math.floor(Math.random()*9999)}`;
      out.unique_id = gen;
    }

    // If potential_patient_for_testing_in_future or extended_family were given as strings elsewhere
    if (row['Potential Patient for testing in future'] && !out.potential_patient_for_testing_in_future) {
      out.potential_patient_for_testing_in_future = parseBoolean(row['Potential Patient for testing in future']);
    }

    // If counselling_date is missing, try to derive from counseling_start_time
    if (dbColumns['counselling_date'] && !out.counselling_date) {
      const startVal = row['Counseling start time '] || row['Counseling start time'] || row['Counseling start time '];
      const dt = parseDateTime(startVal);
      if (dt) {
        // extract date part
        out.counselling_date = dt.split(' ')[0];
      }
    }

    // Build INSERT / ON DUPLICATE KEY UPDATE using unique_id as unique key
    const insertCols = Object.keys(out);
    const placeholders = insertCols.map(() => '?').join(', ');
    const colsSQL = insertCols.join(', ');
    // Build update set skipping unique_id and id
    const updateCols = insertCols.filter(c => c !== 'unique_id' && c !== 'id');
    const updateSQL = updateCols.map(c => `\`${c}\`=VALUES(\`${c}\`)`).join(', ');

    const values = insertCols.map(c => out[c]);

    try {
      const sql = `INSERT INTO genetic_counselling_records (${colsSQL}) VALUES (${placeholders})` +
        (updateSQL ? ` ON DUPLICATE KEY UPDATE ${updateSQL}` : '');
      const [res] = await pool.execute(sql, values);
      // When duplicate key updates occur, affectedRows may be 2 (update) or 1 (insert)
      // Use insertId for new rows
      if (res && res.insertId && res.insertId > 0) inserted++;
      else if (res && res.affectedRows && res.affectedRows > 0) {
        // Heuristic: if affectedRows === 2 it's an update triggered by duplicate key
        if (res.affectedRows === 2) updated++; else inserted++;
      }
    } catch (err) {
      console.error(`Failed to insert row ${processed}:`, err.message);
    }
  }

  console.log(`Finished. Processed: ${processed}, Inserted: ${inserted}, Updated: ${updated}`);
  await pool.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

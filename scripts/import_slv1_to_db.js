import fs from 'fs';
import path from 'path';
import xlsx from 'xlsx';
import mysql from 'mysql2/promise';

// Configuration - adjust if needed
const DB_CONFIG = {
  host: 'localhost',
  user: 'remote_user',
  password: 'Prolab#05',
  database: 'lead_lims2',
  waitForConnections: true,
  connectionLimit: 5,
};

const CSV_PATH = path.resolve(process.cwd(), 'excel_files', 'SL1_V1.csv');

// Field mapping from CSV headers to lead_management columns candidates
const FIELD_MAP = {
  'Unique ID': 'unique_id',
  'Sample ID': 'sample_id',
  'Date': 'date',
  'Created': 'created_at',
  'Modified': 'modified_at',
  'Lead type': 'lead_type',
  'Status': 'status',
  'Genetic counsellor required': 'genetic_counsellor_required',
  'Created By': 'lead_created_by',
  'Sales or Responsible person': 'sales_person',
  'Sample Type': 'sample_type',
  'Organisation': 'organisation_hospital',
  'Clinician': 'clinician_researcher_name',
  'Speciality': 'clinician_speciality',
  'Email': 'clinician_researcher_email',
  'Phone number': 'clinician_researcher_phone',
  'City': 'city',
  "Patients name": 'patient_client_name',
  "Patients mail id": 'patient_client_email',
  "Patients phone number": 'patient_client_phone',
  'Age': 'age',
  'Gender': 'gender',
  'Budget': 'budget',
  'Service Name': 'service_name',
  'Follow up': 'follow_up',
  'Pick up from': 'pick_up_from',
  'Delivery up to': 'delivery_up_to',
  'Sample shipped date': 'sample_shipped_date',
  'Sample shippment amount': 'sample_shipment_amount'
};

function normalizeHeader(h) {
  if (!h) return h;
  return h.replace(/\"/g, '').trim().replace(/\s+/g, ' ');
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (!isNaN(d)) return d.toISOString().slice(0, 19).replace('T', ' ');
  return null;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('CSV file not found:', CSV_PATH);
    process.exit(1);
  }

  console.log('Reading CSV:', CSV_PATH);
  const workbook = xlsx.readFile(CSV_PATH, { raw: false });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false, range: 0 });

  if (!rows || rows.length === 0) {
    console.error('No rows found in CSV.');
    return;
  }

  const rawHeaders = Object.keys(rows[0]);

  // Build mapping of csvKey -> dbColumn
  const csvToDb = {};
  for (const raw of rawHeaders) {
    const norm = normalizeHeader(raw);
    const mapKey = Object.keys(FIELD_MAP).find(k => k.toLowerCase() === norm.toLowerCase());
    if (mapKey) csvToDb[raw] = FIELD_MAP[mapKey];
  }

  const pool = mysql.createPool(DB_CONFIG);
  try {
    const [cols] = await pool.query(
      "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lead_management'",
      [DB_CONFIG.database]
    );
    const existingCols = new Map(cols.map(r => [r.COLUMN_NAME, { dataType: r.DATA_TYPE, maxLength: r.CHARACTER_MAXIMUM_LENGTH }]));

    const mappedCols = new Set();
    for (const csvKey of Object.keys(csvToDb)) {
      const dbCol = csvToDb[csvKey];
      if (existingCols.has(dbCol)) mappedCols.add(dbCol);
    }

    // If DB has project_id, ensure we will populate it from the CSV "Sample ID"
    // (some exports use Sample ID as project identifier; treat project_id = sample_id)
    const sampleCsvHeader = Object.keys(csvToDb).find(k => csvToDb[k] === 'sample_id' || normalizeHeader(k).toLowerCase() === 'sample id');
    if (existingCols.has('project_id')) mappedCols.add('project_id');

    if (!mappedCols.has('status') && existingCols.has('status')) mappedCols.add('status');
    if (!mappedCols.has('unique_id') && existingCols.has('unique_id')) mappedCols.add('unique_id');
    if (!mappedCols.has('id') && existingCols.has('id')) mappedCols.add('id');

    const insertCols = Array.from(mappedCols);
    if (insertCols.length === 0) {
      console.error('No writable columns detected in lead_management matching CSV. Columns found in DB:', Array.from(existingCols).slice(0,50));
      return;
    }

    console.log('Detected lead_management columns to write:', insertCols);

    let processed = 0;
    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      processed++;
      const values = [];
      const placeholders = [];

      for (const col of insertCols) {
        let val = null;
        const csvHeader = Object.keys(csvToDb).find(k => csvToDb[k] === col);
        // If the column is `project_id`, prefer to fill it from the CSV `Sample ID` (mapped above)
        if (col === 'project_id' && sampleCsvHeader) {
          val = row[sampleCsvHeader] ?? null;
        } else if (csvHeader) {
          val = row[csvHeader] ?? null;
        }
        if (csvHeader) {
          val = row[csvHeader] ?? null;
        }
        // If id column exists and CSV doesn't provide it, generate a UUID
        if (col === 'id' && (val === null || val === '')) {
          try {
            // Use crypto.randomUUID if available
            val = (await import('crypto')).randomUUID();
          } catch (e) {
            val = String(Date.now()) + Math.random().toString(36).slice(2, 8);
          }
        }

        // Trim string values to avoid trailing spaces causing type issues
        if (typeof val === 'string') val = val.trim();

        // Determine whether this DB column expects a date/datetime and its max length
        const colInfo = existingCols.get(col) || { dataType: '', maxLength: null };
        const dataType = colInfo.dataType || '';
        const maxLength = colInfo.maxLength;
        const expectsDate = /date|time|timestamp|year/i.test(dataType);

        if (expectsDate) {
          const parsed = parseDate(val);
          if (parsed === null) {
            if (val !== null && val !== '') {
              console.warn(`Warning: column '${col}' expects a datetime but value '${val}' could not be parsed; inserting NULL instead`);
            }
            val = null;
          } else {
            val = parsed;
          }
        }

        // Age: parse leading numeric part and store integer (avoid '11 months' etc.)
        if (col === 'age') {
          if (val === null || val === '') {
            val = null;
          } else {
            const m = String(val).match(/\d+(?:\.\d+)?/);
            if (m) {
              val = Math.floor(Number(m[0]));
            } else {
              val = null;
            }
          }
        }

        if (!expectsDate && (col === 'budget' || col === 'sample_shipment_amount')) {
          if (typeof val === 'string') val = val.replace(/[^0-9.\-]/g, '') || null;
        }

        // Truncate strings that exceed column max length to avoid 'Data too long' errors
        if (typeof val === 'string' && maxLength && val.length > maxLength) {
          console.warn(`Warning: column '${col}' max length ${maxLength} exceeded; truncating value.`);
          val = val.slice(0, maxLength);
        }

        if (col === 'status') {
          val = 'converted';
        }

        values.push(val);
        placeholders.push('?');
      }

      const updates = insertCols
        .filter(c => c !== 'unique_id')
        .map(c => `${c} = VALUES(${c})`)
        .join(', ');

      const sql = `INSERT INTO lead_management (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})` + (updates ? ` ON DUPLICATE KEY UPDATE ${updates}` : '');

      try {
        const [res] = await pool.query(sql, values);
        const info = res && res.affectedRows ? res.affectedRows : 0;
        if (info === 1) inserted++;
        else if (info > 1) updated++;
      } catch (err) {
        console.error('Row insert failed at row', processed, 'error:', err && err.message ? err.message : err);
      }
    }

    console.log(`Finished. Processed: ${processed}, Inserted: ${inserted}, Updated: ${updated}`);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});

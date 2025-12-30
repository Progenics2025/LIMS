const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

// Configuration - updated to use localhost and provided password
const DB_CONFIG = {
  host: 'localhost',
  user: 'remote_user',
  password: 'Prolab#05',
  database: 'lead_lims2',
};

function normalizeValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (t.length === 0) return null;
    if (/^nil$/i.test(t)) return null;
  }
  return v;
}

function parseBooleanLike(v) {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v ? 1 : 0;
  const s = String(v).trim().toLowerCase();
  if (s === '' || s === '0' || s === 'no' || s === 'n' || s === 'false') return 0;
  return 1;
}

function parseIntLike(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return Math.trunc(v);
  const s = String(v).replace(/,/g, '').trim();
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

function parseFloatLike(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return v;
  const s = String(v).replace(/,/g, '').trim();
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function formatDateForMySQL(v) {
  if (!v) return null;
  // If Excel gave a Date object
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 19).replace('T', ' ');
  }
  // Try to parse string
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 19).replace('T', ' ');
  return null;
}

function quoteIdent(name) {
  return `\`` + String(name).replace(/`/g, '``') + `\``;
}

// Map Excel headers to DB columns
const HEADER_TO_COLUMN = {
  'Unique ID': 'unique_id',
  'Unique Id': 'unique_id',
  'Project ID': 'project_id',
  'Lead type': 'lead_type',
  'Status': 'status',
  'Organisation / Hospital': 'organisation_hospital',
  'Clinician / Researcher Name': 'clinician_researcher_name',
  'Speciality': 'speciality',
  'Clinician / Researcher Email': 'clinician_researcher_email',
  'Clinician / Researcher Phone': 'clinician_researcher_phone',
  'Clinician / Researcher Address': 'clinician_researcher_address',
  'Patient / Client Name': 'patient_client_name',
  'Age': 'age',
  'Gender': 'gender',
  'Patient / Client Email': 'patient_client_email',
  'Patient / Client Phone': 'patient_client_phone',
  'Patient / Client Address': 'patient_client_address',
  'Genetic Counselling Required': 'genetic_counselor_required',
  'Nutritional Counselling Required': 'nutritional_counselling_required',
  'Service Name': 'service_name',
  'Amount Quoted': 'amount_quoted',
  'TAT(Days)': 'tat',
  'Sample Type': 'sample_type',
  'No of Samples': 'no_of_samples',
  'Budget': 'budget',
  'Sample Pick up from': 'sample_pick_up_from',
  'Delivery upto': 'delivery_up_to',
  'Sample Collection Date': 'sample_collection_date',
  'Sample shipped date': 'sample_shipped_date',
  'Sample shippment amount': 'sample_shipment_amount',
  'Tracking ID': 'tracking_id',
  'Courier Company': 'courier_company',
  'Sample Received Date': 'sample_recevied_date',
  'Phlebotomist Charges': 'phlebotomist_charges',
  'Progenics TRF': 'progenics_trf',
  'Follow up': 'follow_up',
  'Lead Created By': 'lead_created_by',
  'Sales or Responsible person': 'sales_responsible_person',
  'Lead Created': 'lead_created',
  'Lead Modified': 'lead_modified',
  'Remark / Comment': 'Remark_Comment',
};

// Explicit DB columns we will insert (ensure id and unique_id present, avoid duplicates)
const DB_COLUMNS = Array.from(new Set(['id', 'unique_id', ...Object.values(HEADER_TO_COLUMN)]));

async function main() {
  const filepath = process.argv[2];
  if (!filepath) {
    console.error('Usage: node scripts/import_lead_management.js <path-to-excel-file>');
    process.exit(2);
  }

  const workbook = xlsx.readFile(filepath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });

  if (!rawRows || rawRows.length === 0) {
    console.log('No rows found in the first sheet.');
    return;
  }

  const insertColumns = DB_COLUMNS;
  const placeholders = insertColumns.map(() => '?').join(',');
  const insertSql = `INSERT INTO lead_management (${insertColumns.map(quoteIdent).join(',')}) VALUES (${placeholders})`;

  const valuesArray = rawRows.map((row) => {
    // Check for a provided unique_id in the row (various header forms)
    function extractProvidedUnique(r) {
      for (const k of Object.keys(r)) {
        const norm = k.toLowerCase().replace(/\s+|[-_]/g, '');
        if (norm === 'uniqueid' || norm === 'unique_id') return normalizeValue(r[k]);
      }
      return null;
    }

    const providedUnique = extractProvidedUnique(row);
    const id = randomUUID();
    const unique_id = providedUnique || id;

    const out = { id, unique_id };

    // Map and convert each header
    for (const [header, dbCol] of Object.entries(HEADER_TO_COLUMN)) {
      let raw = row[header];
      raw = normalizeValue(raw);

      switch (dbCol) {
        case 'genetic_counselor_required':
        case 'nutritional_counselling_required':
          out[dbCol] = parseBooleanLike(raw);
          break;
        case 'age':
        case 'no_of_samples':
          out[dbCol] = parseIntLike(raw);
          break;
        case 'budget':
        case 'amount_quoted':
        case 'sample_shipment_amount':
        case 'phlebotomist_charges':
          out[dbCol] = parseFloatLike(raw);
          break;
        case 'sample_collection_date':
        case 'sample_shipped_date':
        case 'sample_recevied_date':
        case 'delivery_up_to':
        case 'lead_created':
        case 'lead_modified':
          out[dbCol] = formatDateForMySQL(raw);
          break;
        default:
          out[dbCol] = raw;
      }
    }

    return insertColumns.map((c) => (out[c] === undefined ? null : out[c]));
  });

  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    await connection.beginTransaction();

    for (let i = 0; i < valuesArray.length; i++) {
      const vals = valuesArray[i];
      await connection.execute(insertSql, vals);
    }

    await connection.commit();
    console.log(`Inserted ${valuesArray.length} rows into lead_management.`);
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    console.error('Error inserting rows:', err);
    process.exitCode = 1;
  } finally {
    if (connection) await connection.end();
  }
}

if (require.main === module) main();

// Notes:
// - Install dependencies: `npm install xlsx mysql2`
// - Run: `node scripts/import_lead_management.js path/to/leads.xlsx`

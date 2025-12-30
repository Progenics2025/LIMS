/**
 * Excel → MySQL Lead Management Import Script
 *
 * Usage:
 *   node scripts/import_lead_management.cjs path/to/leads.xlsx
 *
 * Dependencies:
 *   npm install xlsx mysql2
 */

const xlsx = require('xlsx');
const mysql = require('mysql2/promise');
const { randomUUID } = require('crypto');

/* =========================
   Database Configuration
   ========================= */
const DB_CONFIG = {
  host: 'localhost',
  user: 'remote_user',
  password: 'Prolab#05',
  database: 'lead_lims2',
};

/* =========================
   Helper Functions
   ========================= */
function normalizeValue(v) {
  if (v === undefined || v === null) return null;
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t || /^nil$/i.test(t)) return null;
  }
  return v;
}

function parseBooleanLike(v) {
  if (v === undefined || v === null) return 0;
  if (typeof v === 'number') return v ? 1 : 0;
  const s = String(v).trim().toLowerCase();
  return ['1', 'yes', 'y', 'true'].includes(s) ? 1 : 0;
}

function parseIntLike(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return Math.trunc(v);
  const n = parseInt(String(v).replace(/,/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

function parseFloatLike(v) {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v === 'number') return v;
  const n = parseFloat(String(v).replace(/,/g, ''));
  return Number.isNaN(n) ? null : n;
}

function formatDateForMySQL(v) {
  if (!v) return null;
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 19).replace('T', ' ');
  }
  const d = new Date(v);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().slice(0, 19).replace('T', ' ');
  }
  return null;
}

function quoteIdent(name) {
  return `\`${String(name).replace(/`/g, '``')}\``;
}

/* =========================
   Header → Column Mapping
   ========================= */
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

const DB_COLUMNS = Array.from(
  new Set(['id', 'unique_id', ...Object.values(HEADER_TO_COLUMN)])
);

/* =========================
   Main Import Logic
   ========================= */
async function main() {
  const filepath = process.argv[2];
  if (!filepath) {
    console.error('Usage: node scripts/import_lead_management.cjs <excel-file>');
    process.exit(2);
  }

  const workbook = xlsx.readFile(filepath, { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null, raw: false });

  if (!rows.length) {
    console.log('No rows found.');
    return;
  }

  const insertSql = `
    INSERT INTO lead_management (${DB_COLUMNS.map(quoteIdent).join(',')})
    VALUES (${DB_COLUMNS.map(() => '?').join(',')})
  `;

  const values = rows.map(row => {
    const id = randomUUID();

    const unique_id =
      Object.keys(row).find(k =>
        k.toLowerCase().replace(/[\s_-]/g, '') === 'uniqueid'
      )
        ? normalizeValue(row[Object.keys(row).find(k =>
            k.toLowerCase().replace(/[\s_-]/g, '') === 'uniqueid'
          )])
        : id;

    const record = { id, unique_id };

    for (const [header, col] of Object.entries(HEADER_TO_COLUMN)) {
      const raw = normalizeValue(row[header]);

      switch (col) {
        case 'genetic_counselor_required':
        case 'nutritional_counselling_required':
          record[col] = parseBooleanLike(raw);
          break;
        case 'age':
        case 'no_of_samples':
          record[col] = parseIntLike(raw);
          break;
        case 'budget':
        case 'amount_quoted':
        case 'sample_shipment_amount':
        case 'phlebotomist_charges':
          record[col] = parseFloatLike(raw);
          break;
        case 'sample_collection_date':
        case 'sample_shipped_date':
        case 'sample_recevied_date':
        case 'delivery_up_to':
        case 'lead_created':
        case 'lead_modified':
          record[col] = formatDateForMySQL(raw);
          break;
        default:
          record[col] = raw;
      }
    }

    return DB_COLUMNS.map(c => record[c] ?? null);
  });

  const conn = await mysql.createConnection(DB_CONFIG);

  try {
    await conn.beginTransaction();
    for (const row of values) {
      await conn.execute(insertSql, row);
    }
    await conn.commit();
    console.log(`✅ Inserted ${values.length} rows into lead_management`);
  } catch (err) {
    await conn.rollback();
    console.error('❌ Import failed:', err);
  } finally {
    await conn.end();
  }
}

if (require.main === module) {
  main();
}

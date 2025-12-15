#!/usr/bin/env node
/*
  CommonJS importer copy for environments where package.json sets "type": "module".
  Usage: node scripts/import_lead_management.cjs /path/to/file.xlsx [--sheet "Sheet1"]
*/

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');

function toSnake(s) {
  if (!s && s !== 0) return s;
  return String(s).trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.length < 1) {
    console.error('Usage: node scripts/import_lead_management.cjs /path/to/file.xlsx [--sheet "Sheet1"]');
    process.exit(2);
  }

  const filePath = argv[0];
  let sheetName = null;
  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === '--sheet' && argv[i+1]) { sheetName = argv[i+1]; i++; }
  }

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(2);
  }

  const DB_HOST = process.env.DB_HOST || 'localhost';
  const DB_USER = process.env.DB_USER || 'remote_user';
  const DB_PASSWORD = process.env.DB_PASSWORD || 'Prolab#05';
  const DB_NAME = process.env.DB_NAME || 'lead_lims2';

  console.log(`Reading workbook: ${filePath}`);
  const workbook = XLSX.readFile(filePath, {cellDates: true});
  const firstSheet = workbook.SheetNames[0];
  const useSheet = sheetName || firstSheet;
  if (!workbook.Sheets[useSheet]) {
    console.error('Sheet not found in workbook:', useSheet);
    process.exit(2);
  }

  const sheet = workbook.Sheets[useSheet];
  const rows = XLSX.utils.sheet_to_json(sheet, {defval: null});
  if (!Array.isArray(rows) || rows.length === 0) {
    console.error('No rows found in sheet:', useSheet);
    process.exit(0);
  }

  // Mapping (same as .js script)
  const HEADER_TO_COLUMN = {
    'Unique ID': 'unique_id',
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
    'Remark / Comment': 'remark_comment'
  };

  const sampleHeaders = Object.keys(rows[0]);
  const mappedColumns = [];
  const headerToOrig = [];
  for (const h of sampleHeaders) {
    const mapped = HEADER_TO_COLUMN[h] || toSnake(h);
    mappedColumns.push(mapped);
    headerToOrig.push({ orig: h, col: mapped });
  }

  console.log(`Found ${rows.length} rows. Mapping columns:`, mappedColumns.join(', '));

  const conn = await mysql.createConnection({host: DB_HOST, user: DB_USER, password: DB_PASSWORD, database: DB_NAME});
  try {
    let inserted = 0;
    let updated = 0;
    const [maxRows] = await conn.execute("SELECT MAX(CAST(id AS UNSIGNED)) AS maxId FROM `lead_management`");
    const maxId = (maxRows && maxRows[0] && maxRows[0].maxId) ? Number(maxRows[0].maxId) : 0;
    let nextId = maxId + 1;

    const normalizeBoolean = (v) => {
      if (v == null) return 0;
      const s = String(v).trim().toLowerCase();
      if (['1','true','yes','y'].includes(s)) return 1;
      return 0;
    };

    for (const r of rows) {
      const values = [];
      for (const h of headerToOrig) {
        let v = r[h.orig];
        const col = h.col;
        if (v == null) { values.push(null); continue; }
        if (['age','no_of_samples'].includes(col)) { const n = parseInt(String(v).replace(/[^0-9-]/g, ''), 10); values.push(Number.isNaN(n) ? null : n); continue; }
        if (['amount_quoted','budget','sample_shipment_amount','phlebotomist_charges'].includes(col)) { const f = parseFloat(String(v).toString().replace(/[^0-9.\-]/g, '')); values.push(Number.isNaN(f) ? null : f); continue; }
        if (['genetic_counselor_required','nutritional_counselling_required'].includes(col)) { values.push(normalizeBoolean(v)); continue; }
        if (['sample_collection_date','sample_shipped_date','sample_recevied_date','delivery_up_to','lead_created','lead_modified'].includes(col)) { const d = (v instanceof Date) ? v : new Date(String(v)); if (isNaN(d.getTime())) values.push(null); else values.push(d); continue; }
        values.push(v === '' ? null : v);
      }

      const idValue = String(nextId++);
      const finalColumns = ['id', ...mappedColumns];
      const finalValues = [idValue, ...values];
      const colsSql = finalColumns.map(c => `\`${c}\``).join(', ');
      const placeholders = finalValues.map(_ => '?').join(', ');
      const updateColumns = finalColumns.filter(c => c !== 'id');
      const updateSql = updateColumns.map(c => `\`${c}\`=VALUES(\`${c}\`)`).join(', ');
      const sql = `INSERT INTO \`lead_management\` (${colsSql}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateSql}`;
      try {
        const [res] = await conn.execute(sql, finalValues);
        if (res.affectedRows === 1) inserted++; else if (res.affectedRows >= 2) updated++;
      } catch (err) {
        console.error('Row insert failed, continuing. Error:', err.message);
      }
    }

    console.log(`Done. Inserted: ${inserted}, Updated: ${updated}`);
  } finally {
    await conn.end();
  }
}

main().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});

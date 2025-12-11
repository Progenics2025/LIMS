import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_CSV = path.join(__dirname, '..', 'excel_files', 'lab_process_discovery_samples.csv');
const TABLE_NAME = 'bioinformatics_discovery_sheet';

const FIELD_MAP = {};

function normalizeHeader(h) { if (!h && h !== 0) return ''; return String(h).trim().toLowerCase().replace(/\s+/g, ' '); }
function parseBoolean(v) { if (v == null) return 0; const s = String(v).trim().toLowerCase(); if (!s) return 0; return ['yes','y','true','1','proceed'].includes(s) ? 1 : 0; }
function parseNumber(v) { if (v == null) return null; const s = String(v).replace(/[,₹Rs.\s]/g,'').trim(); if (!s) return null; const n = Number(s); return Number.isNaN(n)?null:n; }
function parseDateTime(v) { if (v == null) return null; const s = String(v).trim(); if (!s) return null; const parsed = Date.parse(s); if (!Number.isNaN(parsed)) { const dt = new Date(parsed); const y=dt.getFullYear(); const m=String(dt.getMonth()+1).padStart(2,'0'); const d=String(dt.getDate()).padStart(2,'0'); const hh=String(dt.getHours()).padStart(2,'0'); const mm=String(dt.getMinutes()).padStart(2,'0'); const ss=String(dt.getSeconds()).padStart(2,'0'); return `${y}-${m}-${d} ${hh}:${mm}:${ss}`; } return null; }
function parseTimeFromValue(v){ if (v==null) return null; const s=String(v).trim(); if(!s) return null; const parsed = Date.parse(s); if(!Number.isNaN(parsed)){ const dt=new Date(parsed); return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}:00`; } const hm=s.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM|am|pm))?/); if(hm){ let hh=Number(hm[1]); const mm=hm[2]; const ap=hm[3]; if(ap){ const apLow=ap.toLowerCase(); if(apLow==='pm'&&hh<12) hh+=12; if(apLow==='am'&&hh===12) hh=0; } return `${String(hh).padStart(2,'0')}:${mm}:00`; } return null; }
function truncateIfNeeded(val,maxLen){ if(val==null||maxLen==null) return val; const s=String(val); if(s.length<=maxLen) return s; return s.slice(0,maxLen); }

async function main(){
  const fileArg = process.argv[2] || DEFAULT_CSV;
  if(!fs.existsSync(fileArg)){ console.error('CSV not found:', fileArg); process.exit(1); }
  const workbook = XLSX.readFile(fileArg, { raw:false, cellDates:true });
  const sheet = workbook.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { defval: null });
  console.log('Rows read:', rows.length);

  const DB_CONFIG = {
    host: 'localhost',
    user: 'remote_user',
    password: 'Prolab#05',
    database: 'lead_lims2'
  };

  const pool = mysql.createPool({
    host: process.env.DB_HOST || DB_CONFIG.host,
    user: process.env.DB_USER || DB_CONFIG.user,
    password: process.env.DB_PASS || DB_CONFIG.password,
    database: process.env.DB_NAME || DB_CONFIG.database,
    waitForConnections: true,
    connectionLimit: 5
  });

  const [colsRes] = await pool.query(`SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`, [process.env.DB_NAME || DB_CONFIG.database,TABLE_NAME]);
  const dbColumns = {}; for(const r of colsRes) dbColumns[r.COLUMN_NAME]={dataType:r.DATA_TYPE,maxLen:r.CHARACTER_MAXIMUM_LENGTH};

  const first = rows[0]||{}; const csvHeaders=Object.keys(first); const csvToDb={};
  for(const h of csvHeaders){ const nh=normalizeHeader(h); if(FIELD_MAP[nh]){ const dbCol=FIELD_MAP[nh]; if(dbColumns[dbCol]) csvToDb[h]=dbCol; continue; } for(const dbCol of Object.keys(dbColumns)){ if(dbCol && normalizeHeader(dbCol)===nh){ csvToDb[h]=dbCol; break; } } }
  console.log('Mapped headers:', csvToDb);

  let processed=0, inserted=0, updated=0;
  for(const row of rows){ processed++; const out={}; for(const [csvHeader, dbCol] of Object.entries(csvToDb)){ let val = row[csvHeader]; if(val === '') val = null; const colInfo = dbColumns[dbCol]; if(!colInfo) continue; if(['date','datetime','timestamp'].includes(colInfo.dataType)){ const dt=parseDateTime(val); if(dt==null && val!=null) console.warn(`Warning: ${dbCol} expects date but couldn't parse '${val}'`); out[dbCol]=dt; continue; } if(colInfo.dataType==='time'){ out[dbCol]=parseTimeFromValue(val); continue; } if(['tinyint','bit'].includes(colInfo.dataType)){ out[dbCol]=parseBoolean(val); continue; } if(['int','bigint','smallint','mediumint'].includes(colInfo.dataType)){ const n=parseNumber(val); out[dbCol]=n==null?null:Math.trunc(n); continue; } if(['decimal','double','float'].includes(colInfo.dataType)){ out[dbCol]=parseNumber(val); continue; } if(colInfo.maxLen){ out[dbCol]=truncateIfNeeded(val,colInfo.maxLen); if(val!=null && String(val).length>colInfo.maxLen) console.warn(`Warning: '${dbCol}' truncated to ${colInfo.maxLen}`); } else out[dbCol]=val; }
    if(!out.unique_id){ out.unique_id=`BIODS${Date.now()}${Math.floor(Math.random()*9999)}`; }
    const insertCols=Object.keys(out); if(insertCols.length===0) continue; const placeholders=insertCols.map(()=>'?').join(', '); const colsSQL=insertCols.join(', '); const updateCols=insertCols.filter(c=>c!=='unique_id'&&c!=='id'); const updateSQL=updateCols.map(c=>`\`${c}\`=VALUES(\`${c}\`)`).join(', '); const values=insertCols.map(c=>out[c]); try{ const sql = `INSERT INTO ${TABLE_NAME} (${colsSQL}) VALUES (${placeholders})` + (updateSQL?` ON DUPLICATE KEY UPDATE ${updateSQL}`:''); const [res]=await pool.execute(sql,values); if(res && res.insertId && res.insertId>0) inserted++; else if(res && res.affectedRows && res.affectedRows>0){ if(res.affectedRows===2) updated++; else inserted++; } } catch(err){ console.error(`Row ${processed} insert failed:`, err.message); } }
  console.log(`Finished. Processed: ${processed}, Inserted: ${inserted}, Updated: ${updated}`);
  await pool.end();
}

main().catch(err=>{ console.error('Fatal:',err); process.exit(1); });

import path from "path";
import fs from "fs";
import xlsx from "xlsx";

function resolveSheetsDir(): string {
  const passed = process.env.SHEETS_DIR;
  if (passed && fs.existsSync(passed)) return passed;
  const rel = path.resolve(process.cwd(), "sharepoint sheets");
  return rel;
}

function isExcelFile(file: string): boolean {
  const lower = file.toLowerCase();
  return lower.endsWith(".xlsx") || lower.endsWith(".xls");
}

function main() {
  const dir = resolveSheetsDir();
  if (!fs.existsSync(dir)) {
    console.error(JSON.stringify({ ok: false, error: `Directory not found: ${dir}` }));
    process.exit(1);
  }

  const files = fs.readdirSync(dir).filter((f) => isExcelFile(f));
  const summary: any[] = [];

  for (const file of files) {
    try {
      const full = path.join(dir, file);
      const wb = xlsx.readFile(full, { cellDates: true });
      const sheets = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const aoa: any[][] = xlsx.utils.sheet_to_json(ws, { header: 1, raw: false });
        const headers = (aoa[0] || []).map((h) => String(h).trim());
        return {
          sheetName: name,
          headers,
          firstRows: aoa.slice(1, 6),
        };
      });
      summary.push({ file, sheets });
    } catch (e: any) {
      summary.push({ file, error: e?.message || String(e) });
    }
  }

  console.log(JSON.stringify({ ok: true, dir, files: files.length, summary }, null, 2));
}

main();




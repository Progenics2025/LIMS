Import Lead Management Excel
=================================

This folder contains a small Node.js script to import rows from a Lead Management Excel sheet into the `lead_management` table in the `lead_lims2` MySQL database.

Prerequisites
-------------
- Node.js (v14+)
- npm
- The Excel file (xlsx) you want to import
- Database access for user `remote_user` (or set `DB_USER` env var)

Install
-------

Install the required npm packages in the repository root:

```bash
npm install xlsx mysql2
```

Usage
-----

Set database environment variables (optional defaults shown):

```bash
export DB_HOST=localhost
export DB_USER=remote_user
export DB_PASSWORD='your_db_password'
export DB_NAME=lead_lims2
```

Run the importer:

If your repository `package.json` contains `"type": "module"` Node will treat `.js` files as ESM and `require()` will fail. Use the CommonJS copy instead:

```bash
node scripts/import_lead_management.cjs /path/to/lead_management.xlsx --sheet "Sheet1"
```

Or, if you prefer, run the original `.js` script after converting it to ESM (update `import` statements) or temporarily change `package.json`.

Notes
-----
- The script maps Excel column headers to snake_case column names and inserts rows into `lead_management`.
- If a row conflicts with an existing UNIQUE key in `lead_management`, the script uses `ON DUPLICATE KEY UPDATE` to update existing rows.
- Verify the resulting columns in the database match the snake_cased header names. If the DB columns differ, provide a mapping or adapt the script to map header names to DB column names.

Verification
------------
After running, check the table row count and sample rows:

```sql
SELECT COUNT(*) FROM lead_management;
SELECT * FROM lead_management LIMIT 10;
```

If you want, I can run the import for you given the file path and DB password, or adjust the script to support a JSON mapping file for headers -> DB columns.

# Quick Verification - Lead Management Upload Integration

## ✅ What's Been Done

The **Lead Management** component has been updated to use the new file upload API:

**Old Endpoint:** `/api/uploads/trf`  
**New Endpoint:** `/api/uploads/categorized?category=Progenics_TRF`

---

## 🧪 How to Test

### Option 1: Using Browser (Recommended - Tests Full Integration)

1. **Start the server**
   ```bash
   cd /home/progenics-bioinfo/LeadLab_LIMS/LeadLab_LIMS\ v2.5\ \(copy\ of\ 2.3\)\ 21_11_25
   npm run dev
   ```

2. **Open browser to your app**
   - Go to: `http://localhost:5173` (or your dev server)

3. **Go to Lead Management**
   - Navigate to the Leads section
   - Click **"+ Add New Lead"** to open the form

4. **Scroll to "Progenics TRF" section**
   - You'll see a text input and a **Choose File** button
   - Open **Browser Console** (F12) to watch the logs

5. **Upload a PDF file**
   - Click the file input button
   - Select any PDF file from your computer
   - **Watch the console** - you should see:
     ```
     ✅ File uploaded successfully: {
       filePath: "uploads/Progenics_TRF/...",
       uploadId: "...",
       category: "Progenics_TRF",
       fileSize: ...
     }
     ```
   - A **green toast notification** should appear:
     ```
     ✅ TRF uploaded successfully to Progenics_TRF folder
     ```

6. **Verify the file exists**
   ```bash
   ls -lh uploads/Progenics_TRF/
   # You should see your uploaded file with timestamp prefix
   ```

7. **Check the database**
   ```bash
   mysql -h 192.168.29.11 -u remote_user -p'Prolab#05' lead_lims2 -e \
   "SELECT filename, category, storage_path, created_at FROM file_uploads WHERE category='Progenics_TRF' ORDER BY created_at DESC LIMIT 1"
   ```

---

### Option 2: Using cURL (Tests Just the API)

```bash
# Create a test PDF file
cat > test.pdf << 'EOF'
%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
xref
0 2
trailer
<< /Size 2 /Root 1 0 R >>
startxref
9
EOF

# Upload via API (same endpoint the component now uses)
curl -X POST "http://127.0.0.1:4000/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=lead-test-001" \
  -F "file=@test.pdf"

# Expected response:
# {
#   "success": true,
#   "filePath": "uploads/Progenics_TRF/1765352998161-test.pdf",
#   "filename": "1765352998161-test.pdf",
#   "uploadId": "...",
#   "category": "Progenics_TRF",
#   "fileSize": 123,
#   "mimeType": "application/pdf"
# }
```

---

## 📋 What to Verify

### ✅ File Upload Response

When you upload a file, the API should respond with:
```json
{
  "success": true,
  "filePath": "uploads/Progenics_TRF/1765352998161-document.pdf",
  "filename": "1765352998161-document.pdf",
  "message": "File uploaded successfully to Progenics_TRF folder",
  "category": "Progenics_TRF",
  "fileSize": 156789,
  "mimeType": "application/pdf",
  "uploadId": "91bf739b-f1a9-4ba4-9190-81bbea7dd34d"
}
```

### ✅ File Location

File should be stored at:
```
/home/progenics-bioinfo/LeadLab_LIMS/LeadLab_LIMS v2.5 (copy of 2.3) 21_11_25/uploads/Progenics_TRF/<timestamp>-<filename>.pdf
```

Not in the old location (`/uploads/trf/`)

### ✅ Database Entry

Query the database:
```bash
mysql -h 192.168.29.11 -u remote_user -p'Prolab#05' lead_lims2 << EOF
SELECT 
  id,
  filename,
  original_name,
  storage_path,
  category,
  file_size,
  mime_type,
  related_entity_type,
  related_entity_id,
  created_at
FROM file_uploads 
WHERE category='Progenics_TRF' 
ORDER BY created_at DESC 
LIMIT 1\G
EOF
```

Should show:
- `category`: Progenics_TRF
- `storage_path`: uploads/Progenics_TRF/...
- `related_entity_type`: lead
- `related_entity_id`: your lead ID

---

## 🎯 Success Checklist

When you upload a file from Lead Management, verify:

- [ ] Form field changes to accept PDF files
- [ ] Browser console shows upload logs (F12)
- [ ] Green toast notification appears: "TRF uploaded successfully to Progenics_TRF folder"
- [ ] File exists in `/uploads/Progenics_TRF/` directory
- [ ] File metadata appears in `file_uploads` table
- [ ] Related entity is linked (lead ID is recorded)
- [ ] No errors in server console

---

## 📁 File Structure After Upload

```
uploads/
├── Progenics_TRF/
│   ├── 1765352998161-document.pdf      ← Your uploaded file
│   └── 1765353062291-test.pdf          ← Another upload
├── Thirdparty_TRF/
├── Progenics_Report/
├── Thirdparty_Report/
└── finance/
```

---

## 💡 What Changed in Code

**Before:**
```javascript
fetch('/api/uploads/trf', { method: 'POST', body: fd })
```

**After:**
```javascript
fetch('/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=' + leadId, { 
  method: 'POST', 
  body: fd 
})
```

The component now:
1. Uses the **new categorized API endpoint**
2. Specifies the **category** (Progenics_TRF)
3. Links the file to the **lead entity**
4. Files are stored in **category-specific folders**
5. **Full metadata tracking** in database

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Connection refused" error | Make sure server is running: `npm run dev` |
| File not uploading | Check browser console for errors (F12) |
| File in wrong folder | Verify API query parameter has `category=Progenics_TRF` |
| No toast notification | Check if `useToast` hook is properly imported |
| File not in database | Check server logs for database errors |
| Form field not updating | Check browser console for JavaScript errors |

---

## ✨ Expected Behavior

### User Flow:
1. User opens Lead Management modal
2. Scrolls to "Progenics TRF" section
3. Clicks "Choose File" button
4. Selects a PDF file
5. File uploads automatically
6. Toast shows: ✅ "TRF uploaded successfully to Progenics_TRF folder"
7. Form field shows the file path: `uploads/Progenics_TRF/1765352998161-document.pdf`
8. When form is saved, this path is stored with the lead

### Backend:
1. File received at `/api/uploads/categorized?category=Progenics_TRF`
2. File validated and moved to `/uploads/Progenics_TRF/`
3. Metadata stored in `file_uploads` table
4. Response returned with file path and upload ID
5. File linked to the lead in database

---

## ✅ Integration Status

**Component Updated:** ✅ LeadManagement.tsx  
**API Endpoint:** ✅ /api/uploads/categorized  
**Database:** ✅ file_uploads table  
**File Storage:** ✅ /uploads/Progenics_TRF/  
**Testing:** Ready for browser testing


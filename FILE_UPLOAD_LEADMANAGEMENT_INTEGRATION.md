# Lead Management - File Upload Integration

**Status:** ✅ **INTEGRATION COMPLETE**

---

## What Was Changed

### File: `client/src/pages/LeadManagement.tsx`

The Progenics TRF file upload handler (lines 1513-1560) was updated to use the new categorized upload API.

#### Old Implementation
```javascript
const res = await fetch('/api/uploads/trf', { method: 'POST', body: fd });
if (res.ok) {
  const data = await res.json();
  form.setValue('progenicsTrf', data.url);
  toast({ title: 'Success', description: 'TRF uploaded successfully' });
}
```

#### New Implementation
```javascript
const res = await fetch('/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=' + (form.getValues('id') || 'new'), { 
  method: 'POST', 
  body: fd 
});
if (res.ok) {
  const data = await res.json();
  // Store the file path from the new API response
  form.setValue('progenicsTrf', data.filePath);
  console.log('✅ File uploaded successfully:', {
    filePath: data.filePath,
    uploadId: data.uploadId,
    category: data.category,
    fileSize: data.fileSize
  });
  toast({ 
    title: 'Success', 
    description: `TRF uploaded successfully to ${data.category} folder` 
  });
}
```

---

## Key Changes

| Aspect | Old | New |
|--------|-----|-----|
| **Endpoint** | `/api/uploads/trf` | `/api/uploads/categorized?category=Progenics_TRF` |
| **Category** | Hardcoded (no routing) | `Progenics_TRF` (automatically routes to correct folder) |
| **Entity Linking** | No linking | Linked to lead by ID (entityType=lead, entityId=leadId) |
| **Response Format** | `{ url }` | `{ filePath, uploadId, category, fileSize, mimeType }` |
| **Folder Storage** | `/uploads/trf/` | `/uploads/Progenics_TRF/` (categorized) |
| **Database Tracking** | No metadata | Full metadata with audit trail |
| **Form Field Name** | `'trf'` | `'file'` (multer standard) |

---

## How It Works Now

### 1. User Selects File in Lead Management Modal

```
User opens Lead Management modal
    ↓
Scrolls to "Progenics TRF" section
    ↓
Clicks "Choose File" button
    ↓
Selects a PDF file
```

### 2. File is Uploaded to New API

```
JavaScript trigger: onChange event
    ↓
Validate file (must be PDF)
    ↓
Create FormData with file
    ↓
POST to: /api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=<leadId>
    ↓
File processed by uploadHandler
    ↓
File moved to: /uploads/Progenics_TRF/<timestamp>-<filename>
    ↓
Metadata stored in file_uploads table
```

### 3. Response is Handled

```
API returns:
{
  "success": true,
  "filePath": "uploads/Progenics_TRF/1765352998161-document.pdf",
  "filename": "1765352998161-document.pdf",
  "uploadId": "91bf739b-f1a9-4ba4-9190-81bbea7dd34d",
  "category": "Progenics_TRF",
  "fileSize": 156789,
  "mimeType": "application/pdf"
}
    ↓
Form field 'progenicsTrf' is set to: "uploads/Progenics_TRF/1765352998161-document.pdf"
    ↓
Toast notification shows: "TRF uploaded successfully to Progenics_TRF folder"
    ↓
Console logs: File metadata for debugging
```

---

## Testing the Integration

### Step 1: Start the Server

```bash
cd /home/progenics-bioinfo/LeadLab_LIMS/LeadLab_LIMS\ v2.5\ \(copy\ of\ 2.3\)\ 21_11_25
npm run dev
```

Wait for server to start (5-10 seconds). You should see:
```
✅ File upload directories initialized
1:18:59 PM [express] serving on port 4000
```

### Step 2: Open Lead Management in Browser

1. Go to `http://localhost:5173` (or your dev server URL)
2. Navigate to **Lead Management**
3. Click **"+ Add New Lead"** or edit an existing lead
4. Scroll to the **"Progenics TRF"** section

### Step 3: Upload a Test File

1. Click the **"Choose File"** button next to "Progenics TRF"
2. Select a **PDF file** from your computer
3. The file will be uploaded automatically
4. **You should see:** A green success toast notification:
   ```
   Success
   TRF uploaded successfully to Progenics_TRF folder
   ```

### Step 4: Verify File Was Stored

#### Check on Disk
```bash
ls -lh /home/progenics-bioinfo/LeadLab_LIMS/LeadLab_LIMS\ v2.5\ \(copy\ of\ 2.3\)\ 21_11_25/uploads/Progenics_TRF/
```

You should see your uploaded file with a timestamp prefix.

#### Check in Database
```bash
mysql -h 192.168.29.11 -u remote_user -p'Prolab#05' lead_lims2 << EOF
SELECT id, filename, original_name, storage_path, category, file_size, mime_type, related_entity_type, related_entity_id, created_at 
FROM file_uploads 
WHERE category = 'Progenics_TRF' 
ORDER BY created_at DESC 
LIMIT 5;
EOF
```

You should see your file listed with:
- `category`: `Progenics_TRF`
- `related_entity_type`: `lead`
- `related_entity_id`: Your lead ID
- `storage_path`: Points to the correct folder

#### Check Browser Console
Open **Developer Tools (F12)** → **Console** tab

You should see:
```javascript
✅ File uploaded successfully: {
  filePath: "uploads/Progenics_TRF/1765352998161-document.pdf",
  uploadId: "91bf739b-f1a9-4ba4-9190-81bbea7dd34d",
  category: "Progenics_TRF",
  fileSize: 156789
}
```

---

## Complete Test Flow

```bash
# 1. Create a test PDF file
echo "%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
xref
0 2
trailer
<< /Size 2 /Root 1 0 R >>
startxref
EOF
" > test_document.pdf

# 2. Start server (if not already running)
npm run dev &
sleep 10

# 3. Upload via curl to verify API works
curl -X POST "http://127.0.0.1:4000/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=test-lead-1" \
  -F "file=@test_document.pdf"

# 4. Verify file exists
ls -lh uploads/Progenics_TRF/

# 5. Verify database
mysql -h 192.168.29.11 -u remote_user -p'Prolab#05' lead_lims2 -e "SELECT * FROM file_uploads WHERE category='Progenics_TRF' LIMIT 1"
```

---

## Browser Testing Steps

### Manual Test (Recommended for Initial Verification)

1. **Open Browser Console**
   - Press `F12` to open Developer Tools
   - Go to **Console** tab
   - Keep this open to watch for upload logs

2. **Navigate to Lead Management**
   - URL: `http://localhost:5173/leads` (or your dev server)
   - Click **"+ Add New Lead"**

3. **Scroll to Progenics TRF Section**
   - Look for the label "Progenics TRF"
   - You should see an input field with a file upload button

4. **Upload a PDF File**
   - Click the file input button
   - Select a PDF file (any PDF will work for testing)
   - Observe:
     - Console logs the file details
     - Toast notification appears (green success message)
     - Form field updates with the file path

5. **Verify Form Field Updated**
   - The "Progenics TRF" input field should now contain:
     - `uploads/Progenics_TRF/1765352998161-yourfile.pdf`
     - This is the path to your uploaded file

6. **Check Server Console**
   - Look at your server terminal output
   - You should see logs like:
     ```
     POST /api/uploads/categorized 200 in 45ms
     ```

---

## Success Indicators

### ✅ Upload Successful If You See:

1. **Browser Console:**
   ```
   ✅ File uploaded successfully: {
     filePath: "uploads/Progenics_TRF/...",
     uploadId: "...",
     category: "Progenics_TRF",
     fileSize: ...
   }
   ```

2. **Toast Notification:**
   ```
   ✅ Success
   TRF uploaded successfully to Progenics_TRF folder
   ```

3. **Form Field Updated:**
   - The input shows the file path

4. **On Disk:**
   ```bash
   $ ls -lh uploads/Progenics_TRF/
   -rw-r--r-- 1 user user 156789 Dec 10 14:30 1765352998161-document.pdf
   ```

5. **In Database:**
   ```sql
   mysql> SELECT * FROM file_uploads WHERE category='Progenics_TRF' ORDER BY created_at DESC LIMIT 1;
   
   id: 91bf739b-f1a9-4ba4-9190-81bbea7dd34d
   category: Progenics_TRF
   storage_path: uploads/Progenics_TRF/1765352998161-document.pdf
   related_entity_type: lead
   related_entity_id: <your-lead-id>
   created_at: 2025-12-10 13:19:58
   ```

### ❌ Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| "Connection refused" | Server not running | Run `npm run dev` |
| "Invalid category" | API parameter wrong | Check URL has `?category=Progenics_TRF` |
| "No file uploaded" | Missing form field | Ensure form field name is `'file'` in FormData |
| File not in folder | Upload failed silently | Check browser console for errors |
| Database entry missing | Metadata storage failed | Check server logs for DB errors |

---

## Next Steps

### For Other File Types

To add file upload for other categories (Thirdparty_TRF, Progenics_Report, etc.), follow the same pattern:

```javascript
// For Thirdparty TRF
const res = await fetch('/api/uploads/categorized?category=Thirdparty_TRF&entityType=lead&entityId=' + leadId, { 
  method: 'POST', 
  body: fd 
});

// For Progenics Report
const res = await fetch('/api/uploads/categorized?category=Progenics_Report&entityType=lead&entityId=' + leadId, { 
  method: 'POST', 
  body: fd 
});
```

### For Multiple File Uploads

To create a reusable component, use the `useFileUpload` hook from `FILE_UPLOAD_CODE_SNIPPETS.md`:

```typescript
const { loading, error, upload } = useFileUpload({
  category: 'Progenics_TRF',
  entityType: 'lead',
  entityId: leadId,
});

const handleUpload = async (file) => {
  const result = await upload(file);
  if (result?.success) {
    form.setValue('progenicsTrf', result.filePath);
  }
};
```

---

## Summary

✅ **Integration Complete**

The Lead Management component now uses the new categorized file upload API:
- Files are routed to `/uploads/Progenics_TRF/` automatically
- File metadata is tracked in the database
- Entity linking connects uploads to specific leads
- Console logs and toast notifications provide feedback

The system is **ready for testing in the browser**.


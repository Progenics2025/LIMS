# File Upload System - Testing & Verification Guide

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run migration: `mysql -u root -p lead_lims2 < database/migrations/0025_create_file_uploads_tracking.sql`
- [ ] Verify table created: `DESCRIBE file_uploads;`
- [ ] Verify indexes created: `SHOW INDEXES FROM file_uploads;`

### 2. File System Setup
- [ ] `uploads/` directory exists
- [ ] Server has write permissions on `uploads/`
- [ ] All subdirectories will be created on startup

### 3. Code Review
- [ ] `server/lib/uploadHandler.ts` exists
- [ ] `server/routes.ts` has `ensureUploadDirectories()` call
- [ ] `server/routes.ts` has `/api/uploads/categorized` endpoint
- [ ] `server/storage.ts` has 4 new upload methods

---

## Unit Tests

### Test 1: Upload Handler Validation

```typescript
// __tests__/uploadHandler.test.ts
import { validateFile, generateUniqueFilename, getCategoryFolder } from '@server/lib/uploadHandler';

describe('Upload Handler', () => {
  describe('validateFile', () => {
    it('should reject if no file provided', () => {
      const result = validateFile(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('No file uploaded');
    });

    it('should reject file exceeding size limit', () => {
      const file = {
        size: 100 * 1024 * 1024, // 100MB
      } as Express.Multer.File;
      const result = validateFile(file, 50 * 1024 * 1024);
      expect(result.valid).toBe(false);
    });

    it('should accept valid file', () => {
      const file = {
        size: 1024 * 1024, // 1MB
        originalname: 'document.pdf',
      } as Express.Multer.File;
      const result = validateFile(file);
      expect(result.valid).toBe(true);
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate timestamp-based filename', () => {
      const filename = generateUniqueFilename('document.pdf');
      expect(filename).toMatch(/^\d+-document\.pdf$/);
    });

    it('should sanitize special characters', () => {
      const filename = generateUniqueFilename('doc ument (1).pdf');
      expect(filename).toMatch(/^\d+-doc_ument__1_\.pdf$/);
    });
  });

  describe('getCategoryFolder', () => {
    it('should return correct path for valid category', () => {
      const path = getCategoryFolder('Progenics_TRF');
      expect(path).toContain('uploads/Progenics_TRF');
    });

    it('should throw for invalid category', () => {
      expect(() => {
        getCategoryFolder('Invalid_Category');
      }).toThrow();
    });
  });
});
```

### Test 2: API Endpoint Tests

```typescript
// __tests__/uploadEndpoint.test.ts
import request from 'supertest';
import { app } from '@server/index';
import fs from 'fs';
import path from 'path';

describe('POST /api/uploads/categorized', () => {
  it('should return 400 if no category provided', async () => {
    const response = await request(app)
      .post('/api/uploads/categorized')
      .attach('file', '__tests__/fixtures/test.pdf');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should return 400 if no file provided', async () => {
    const response = await request(app)
      .post('/api/uploads/categorized?category=Progenics_TRF')
      .send();

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('should upload file and return success', async () => {
    const response = await request(app)
      .post('/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=lead-123')
      .attach('file', '__tests__/fixtures/test.pdf');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.filePath).toContain('uploads/Progenics_TRF/');
    expect(response.body.uploadId).toBeDefined();
  });

  it('should save file to correct category folder', async () => {
    const response = await request(app)
      .post('/api/uploads/categorized?category=Progenics_Report')
      .attach('file', '__tests__/fixtures/test.pdf');

    expect(response.body.success).toBe(true);
    
    const filePath = path.join(process.cwd(), response.body.filePath);
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('should store metadata in database', async () => {
    const response = await request(app)
      .post('/api/uploads/categorized?category=Thirdparty_TRF&entityType=sample&entityId=sample-456')
      .attach('file', '__tests__/fixtures/test.pdf');

    const uploadRecord = await db.select().from(fileUploads)
      .where(eq(fileUploads.id, response.body.uploadId));

    expect(uploadRecord).toHaveLength(1);
    expect(uploadRecord[0].category).toBe('Thirdparty_TRF');
    expect(uploadRecord[0].relatedEntityType).toBe('sample');
    expect(uploadRecord[0].relatedEntityId).toBe('sample-456');
  });
});

describe('GET /api/uploads/category/:category', () => {
  it('should return all uploads for category', async () => {
    // First, upload a file
    const uploadResponse = await request(app)
      .post('/api/uploads/categorized?category=Progenics_TRF')
      .attach('file', '__tests__/fixtures/test.pdf');

    // Then query by category
    const response = await request(app)
      .get('/api/uploads/category/Progenics_TRF');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.uploads).toBeInstanceOf(Array);
    expect(response.body.category).toBe('Progenics_TRF');
  });
});

describe('GET /api/uploads/entity/:entityType/:entityId', () => {
  it('should return uploads for specific entity', async () => {
    const response = await request(app)
      .get('/api/uploads/entity/lead/lead-123');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.entityType).toBe('lead');
    expect(response.body.entityId).toBe('lead-123');
  });
});
```

---

## Manual Testing

### Test 2.1: Test Upload via cURL

```bash
# Create a test PDF
echo "test content" > /tmp/test.pdf

# Upload to Progenics_TRF category
curl -X POST \
  "http://localhost:3000/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=lead-123" \
  -F "file=@/tmp/test.pdf" \
  -v

# Expected response:
# {
#   "success": true,
#   "filePath": "uploads/Progenics_TRF/1764259675840-test.pdf",
#   "filename": "1764259675840-test.pdf",
#   "uploadId": "550e8400-e29b-41d4-a716-446655440000",
#   "fileSize": 12,
#   "mimeType": "application/pdf"
# }
```

### Test 2.2: Verify File on Disk

```bash
# List all files in Progenics_TRF folder
ls -la uploads/Progenics_TRF/

# Expected:
# total 12
# drwxr-xr-x 2 user group 4096 Dec 10 14:30 .
# drwxr-xr-x 6 user group 4096 Dec 10 14:28 ..
# -rw-r--r-- 1 user group   12 Dec 10 14:30 1764259675840-test.pdf

# Verify file can be read
cat uploads/Progenics_TRF/1764259675840-test.pdf
# Output: test content
```

### Test 2.3: Query Uploads via API

```bash
# Get all uploads in Progenics_TRF category
curl http://localhost:3000/api/uploads/category/Progenics_TRF | jq .

# Expected:
# {
#   "success": true,
#   "category": "Progenics_TRF",
#   "uploads": [
#     {
#       "id": "550e8400-...",
#       "filename": "1764259675840-test.pdf",
#       "original_name": "test.pdf",
#       "storage_path": "uploads/Progenics_TRF/1764259675840-test.pdf",
#       "category": "Progenics_TRF",
#       "file_size": 12,
#       "mime_type": "application/pdf",
#       "created_at": "2025-12-10T14:30:00Z"
#     }
#   ],
#   "total": 1
# }

# Get uploads for specific entity
curl http://localhost:3000/api/uploads/entity/lead/lead-123 | jq .
```

### Test 2.4: Download Uploaded File

```bash
# Download file via static serve
curl http://localhost:3000/uploads/Progenics_TRF/1764259675840-test.pdf -o /tmp/downloaded.pdf

# Verify it matches original
diff /tmp/test.pdf /tmp/downloaded.pdf
# (should be identical, no output means success)
```

---

## Browser-Based Testing

### Test 3.1: Manual Upload with Browser

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser to:** `http://localhost:5173` (or your dev port)

3. **Open browser DevTools Console**

4. **Paste this code to test upload:**
   ```javascript
   // Create a test file
   const blob = new Blob(['test content'], { type: 'application/pdf' });
   const file = new File([blob], 'test-document.pdf', { type: 'application/pdf' });
   
   // Upload it
   const formData = new FormData();
   formData.append('file', file);
   
   fetch(
     '/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=lead-123',
     { method: 'POST', body: formData }
   )
     .then(r => r.json())
     .then(data => {
       console.log('Upload result:', data);
       if (data.success) {
         console.log('✅ File uploaded to:', data.filePath);
         console.log('📋 Upload ID:', data.uploadId);
       }
     });
   ```

5. **Check browser console for response**

### Test 3.2: Test All Categories

```javascript
const categories = ['Progenics_TRF', 'Thirdparty_TRF', 'Progenics_Report', 'Thirdparty_Report'];

for (const category of categories) {
  const blob = new Blob(['test'], { type: 'application/pdf' });
  const file = new File([blob], `test-${category}.pdf`, { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', file);
  
  fetch(`/api/uploads/categorized?category=${category}`, {
    method: 'POST',
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      console.log(`${category}: ${data.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    });
}
```

---

## Integration Testing Scenarios

### Scenario 1: LeadManagement TRF Upload

1. Open Lead Management page
2. Click "Upload Progenics TRF" button (if implemented)
3. Select a PDF file
4. Verify:
   - ✅ File appears in `uploads/Progenics_TRF/`
   - ✅ Metadata stored in `file_uploads` table
   - ✅ File can be downloaded
   - ✅ Lead record updates with file path

### Scenario 2: ProcessMaster Report Upload

1. Open ProcessMaster page
2. Click "Upload Report" button
3. Select multiple PDFs
4. Verify:
   - ✅ Each file saved to correct category folder
   - ✅ All uploads linked to the same entity
   - ✅ Upload history shows all files
   - ✅ Query `/api/uploads/entity/sample/...` returns all

### Scenario 3: File Size Limits

1. Create a file > 50MB
2. Try to upload
3. Verify:
   - ✅ Request rejected with size limit error
   - ✅ No file saved to disk
   - ✅ No database record created

### Scenario 4: Invalid File Type

1. Try to upload a .exe or .zip file
2. Verify:
   - ✅ Currently accepts all types (you may want to add restrictions)
   - ✅ File saved with correct MIME type in DB

---

## Database Verification

### Verify Table Structure

```sql
-- Check table exists and has correct columns
DESCRIBE file_uploads;

-- Expected output:
-- id                      | varchar(36) | NO | PRI |
-- filename                | varchar(255)| NO | |
-- original_name           | varchar(255)| YES| |
-- storage_path            | varchar(500)| NO | |
-- category                | varchar(100)| NO | MUL |
-- file_size               | bigint      | YES| |
-- mime_type               | varchar(100)| YES| |
-- uploaded_by             | varchar(255)| YES| |
-- related_entity_type     | varchar(100)| YES| |
-- related_entity_id       | varchar(255)| YES| |
-- created_at              | datetime    | YES| MUL |
-- updated_at              | datetime    | YES| MUL |
-- is_deleted              | tinyint(1)  | YES| |
```

### Verify Indexes

```sql
-- Check indexes
SHOW INDEXES FROM file_uploads;

-- Expected indexes:
-- PRIMARY (id)
-- idx_category (category)
-- idx_related_entity (related_entity_type, related_entity_id)
-- idx_created_at (created_at)
```

### Check Uploaded Records

```sql
-- View all uploads
SELECT id, filename, category, file_size, created_at FROM file_uploads;

-- View uploads for specific category
SELECT * FROM file_uploads WHERE category = 'Progenics_TRF';

-- View uploads for specific entity
SELECT * FROM file_uploads 
WHERE related_entity_type = 'lead' 
  AND related_entity_id = 'lead-123';

-- Check storage by category
SELECT category, COUNT(*) as count, SUM(file_size) as total_size 
FROM file_uploads 
WHERE is_deleted = 0
GROUP BY category;
```

---

## Disk Space Monitoring

### Monitor Upload Directory Size

```bash
# Check total size of uploads
du -sh uploads/

# Check size per category
du -sh uploads/Progenics_TRF/
du -sh uploads/Thirdparty_TRF/
du -sh uploads/Progenics_Report/
du -sh uploads/Thirdparty_Report/

# Count files per category
find uploads/Progenics_TRF -type f | wc -l
find uploads/Thirdparty_TRF -type f | wc -l

# Find largest files
find uploads -type f -exec ls -lh {} \; | sort -k5 -hr | head -20
```

---

## Performance Testing

### Load Test: Upload Concurrent Files

```bash
# Create 10 test files
for i in {1..10}; do
  dd if=/dev/zero of=/tmp/test-$i.pdf bs=1M count=5
done

# Upload all concurrently
for i in {1..10}; do
  curl -X POST \
    "http://localhost:3000/api/uploads/categorized?category=Progenics_TRF" \
    -F "file=@/tmp/test-$i.pdf" \
    &
done

wait  # Wait for all to complete

# Check database performance
time mysql -u root -p lead_lims2 -e "SELECT COUNT(*) FROM file_uploads;"
```

---

## Troubleshooting Checklist

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| 400 "Category parameter required" | Missing ?category in URL | Add ?category=Progenics_TRF to upload URL |
| 400 "No file uploaded" | No file in multipart body | Ensure form data has 'file' field with file |
| 500 "File upload failed" | Permission error | Check write permissions on uploads/ |
| Files not in category folder | Directory not created | Ensure ensureUploadDirectories() called on startup |
| DB record not created | Migration not applied | Run migration: `mysql ... < 0025_create_file_uploads_tracking.sql` |
| Upload succeeds but file missing | File moved to wrong location | Check handleFileUpload() logic |
| Slow uploads | Network/disk I/O | Monitor server load, check file size |
| Files not downloaded | Static serve not configured | Ensure `app.use('/uploads', static(...))` in routes.ts |

---

## Success Criteria

✅ **Deployment Successful When:**

1. ✅ Migration runs without errors
2. ✅ `file_uploads` table exists with correct schema
3. ✅ All 4 upload directories created on startup
4. ✅ POST /api/uploads/categorized accepts files
5. ✅ Files save to correct category folder
6. ✅ Metadata stored in database
7. ✅ Files downloadable via /uploads/...
8. ✅ GET /api/uploads/category/:cat returns uploads
9. ✅ GET /api/uploads/entity/:type/:id returns uploads
10. ✅ Browser can upload files from modal
11. ✅ Uploaded files persist after server restart
12. ✅ No file size limitations preventing normal usage

---

## Post-Deployment Checklist

- [ ] Verify all uploads directories exist
- [ ] Test upload from all modal components
- [ ] Check disk space usage is reasonable
- [ ] Verify database backup includes file_uploads table
- [ ] Monitor file upload errors in logs
- [ ] Test recovery from disk full scenario
- [ ] Document any custom category additions
- [ ] Set up automated backups of uploads/
- [ ] Monitor database query performance


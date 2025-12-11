# File Upload System - Visual Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React Components)                  │
│                                                                   │
│  LeadManagement  ProcessMaster  Bioinformatics  Nutrition        │
│        Modal          Modal          Modal        Modal          │
│        │              │              │            │              │
│        └──────────────┬──────────────┴────────────┘              │
│                       │                                          │
│                 POST /api/uploads/categorized                    │
│         (with ?category=Progenics_TRF&entityType=lead)           │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (Node.js/Express)                    │
│                                                                   │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  Route Handler: POST /api/uploads/categorized           │  │
│   │  - Receives file from multipart/form-data                │  │
│   │  - Extracts category from query params                   │  │
│   │  - Calls handleFileUpload(file, category)                │  │
│   └──────────────────┬──────────────────────────────────────┘  │
│                      │                                           │
│   ┌──────────────────▼──────────────────┐                      │
│   │  uploadHandler.ts                    │                      │
│   │  ┌────────────────────────────────┐ │                      │
│   │  │ handleFileUpload() [MAIN]       │ │                      │
│   │  │ - Validate file                 │ │                      │
│   │  │ - Get category folder           │ │                      │
│   │  │ - Generate unique filename      │ │                      │
│   │  │ - Move file to category folder  │ │                      │
│   │  │ - Return { success, filePath }  │ │                      │
│   │  └────────────────────────────────┘ │                      │
│   │                                      │                      │
│   │ Category Mapping:                    │                      │
│   │ ├─ Progenics_TRF → uploads/...      │                      │
│   │ ├─ Thirdparty_TRF → uploads/...     │                      │
│   │ ├─ Progenics_Report → uploads/...   │                      │
│   │ └─ Thirdparty_Report → uploads/...  │                      │
│   └──────────────────┬──────────────────┘                      │
│                      │                                           │
│   ┌──────────────────▼──────────────────┐                      │
│   │  storage.ts                          │                      │
│   │  createFileUpload(uploadData)         │                      │
│   │  - Insert record into DB              │                      │
│   │  - Store: filename, path, category    │                      │
│   │  - Store: size, mimetype, uploader    │                      │
│   │  - Return upload record with ID       │                      │
│   └──────────────────┬──────────────────┘                      │
│                      │                                           │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FILE SYSTEM                                   │
│                                                                   │
│  uploads/                                                        │
│  ├── Progenics_TRF/                                             │
│  │   ├── 1764259675840-document.pdf                            │
│  │   ├── 1764259675842-document.pdf                            │
│  │   └── ...                                                   │
│  ├── Thirdparty_TRF/                                            │
│  │   ├── 1764259675843-thirdparty.pdf                          │
│  │   └── ...                                                   │
│  ├── Progenics_Report/                                         │
│  │   ├── 1764259675844-report.pdf                             │
│  │   └── ...                                                   │
│  └── Thirdparty_Report/                                        │
│      ├── 1764259675845-report.pdf                             │
│      └── ...                                                   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                       ▲
                       │
┌──────────────────────┴──────────────────────────────────────────┐
│                    DATABASE                                      │
│                                                                   │
│  file_uploads table:                                            │
│  ┌─────────────┬───────────────────────────────────────────┐   │
│  │ id          │ 550e8400-e29b-41d4-a716-446655440000     │   │
│  │ filename    │ 1764259675840-document.pdf               │   │
│  │ original... │ document.pdf                             │   │
│  │ storage_... │ uploads/Progenics_TRF/1764259675840-...  │   │
│  │ category    │ Progenics_TRF                            │   │
│  │ file_size   │ 2048576                                  │   │
│  │ mime_type   │ application/pdf                          │   │
│  │ uploaded_by │ user@example.com                         │   │
│  │ entity_type │ lead                                     │   │
│  │ entity_id   │ lead-123                                 │   │
│  │ created_at  │ 2025-12-10 14:30:00                      │   │
│  └─────────────┴───────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
1. User selects file in modal
   │
2. Frontend: new File(...)
   │
3. Frontend: FormData.append('file', file)
   │
4. Frontend: fetch('/api/uploads/categorized?category=Progenics_TRF...')
   │
5. Multer: Parse multipart/form-data
   ├─ Save file temporarily to disk
   ├─ Create req.file object
   │
6. Express Route Handler
   ├─ Extract category from query.category
   ├─ Call handleFileUpload(req.file, category)
   │
7. handleFileUpload()
   ├─ Validate file
   ├─ Get category folder: uploads/Progenics_TRF/
   ├─ Generate unique filename: 1764259675840-document.pdf
   ├─ Move file to category folder
   ├─ Return { success: true, filePath: 'uploads/Progenics_TRF/...' }
   │
8. Route Handler
   ├─ Call storage.createFileUpload(uploadData)
   │
9. Storage Layer
   ├─ INSERT INTO file_uploads (...)
   ├─ Return upload record with ID
   │
10. Route Handler
    ├─ Return JSON response with success, filePath, uploadId
    │
11. Frontend
    ├─ Receive response
    ├─ Save filePath to lead.progenics_trf
    ├─ Display upload success message
    │
12. Frontend can later query uploads via:
    ├─ GET /api/uploads/category/Progenics_TRF
    └─ GET /api/uploads/entity/lead/lead-123
```

---

## File Organization Before & After

### BEFORE (without category routing)
```
uploads/
├── 1764259675840-document.pdf      (Is this TRF or Report?)
├── 1764259675842-document.pdf      (What category?)
├── 1764259675843-report.pdf        (For what entity?)
├── 1764259675844-trf.pdf           (No organization!)
├── 1764259675845-data.pdf
└── ... (flat, unorganized, hard to maintain)
```

### AFTER (with category routing)
```
uploads/
├── Progenics_TRF/
│   ├── 1764259675840-document.pdf
│   ├── 1764259675842-document.pdf
│   └── 1764259675851-document.pdf
├── Thirdparty_TRF/
│   └── 1764259675843-report.pdf
├── Progenics_Report/
│   ├── 1764259675844-trf.pdf
│   └── 1764259675846-data.pdf
└── Thirdparty_Report/
    └── 1764259675845-report.pdf
```

**Benefits:**
- ✅ Organized by purpose (category)
- ✅ Easy to manage and back up
- ✅ Clear where files belong
- ✅ Can set different permissions per category
- ✅ Easy to implement category-specific processing

---

## API Endpoint Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| **POST** | `/api/uploads/categorized` | **Upload file** with category routing |
| GET | `/api/uploads/category/:cat` | Get uploads in a category |
| GET | `/api/uploads/entity/:type/:id` | Get uploads for an entity |
| GET | `/uploads/:path` | **Download file** (static serve) |

---

## Key Decision Points

### ✅ WHERE files are stored?
**Answer:** In category-specific folders under `uploads/`
- `uploads/Progenics_TRF/` for Progenics TRF documents
- `uploads/Thirdparty_TRF/` for Third-party TRF documents
- `uploads/Progenics_Report/` for Progenics reports
- `uploads/Thirdparty_Report/` for Third-party reports

### ✅ HOW are files named?
**Answer:** Timestamp-based with original extension preserved
- Format: `[timestamp]-[sanitized-filename]`
- Example: `1764259675840-document.pdf`
- Prevents name collisions, preserves original names

### ✅ WHAT metadata is stored?
**Answer:** Complete audit trail in `file_uploads` table
- Original filename, sanitized filename
- Full storage path
- Category, MIME type, file size
- Who uploaded it (user ID)
- Which entity it belongs to (lead ID, sample ID, etc.)
- When it was uploaded
- Soft-delete flag for record keeping

### ✅ WHO can access uploads?
**Answer:** Anyone with a browser can download via `/uploads/...`
- Currently NO authentication on file serving
- Consider adding auth middleware if needed
- See TODO section for security enhancements

### ✅ HOW to link uploads to records?
**Answer:** Via `related_entity_type` and `related_entity_id`
- Store in database for audit trail
- Use for querying: `/api/uploads/entity/lead/lead-123`
- Multiple uploads can link to same entity

---

## Code Structure Overview

```
server/
├── routes.ts                          ← Main API endpoints
│   ├─ POST /api/uploads/categorized  ← New unified upload
│   ├─ GET /api/uploads/category/...
│   ├─ GET /api/uploads/entity/...
│   └─ ensureUploadDirectories() [CALL ON STARTUP]
│
├── lib/
│   └─ uploadHandler.ts                ← Upload utility functions
│       ├─ ensureUploadDirectories()
│       ├─ getCategoryFolder()
│       ├─ validateFile()
│       ├─ handleFileUpload()          ← [MAIN FUNCTION]
│       └─ sanitizeFilename()
│
├── storage.ts                         ← Database methods
│   └─ DBStorage class
│       ├─ createFileUpload()
│       ├─ getFileUploadsByCategory()
│       ├─ getFileUploadsByEntity()
│       └─ getFileUploadById()
│
└── db/
    └─ [Connection pool & Drizzle ORM]

database/
└── migrations/
    └─ 0025_create_file_uploads_tracking.sql  ← DB schema

client/
└── components/
    └─ [Use FileUploadButton or similar]
```

---

## Real-World Example Flow

```
🎬 SCENARIO: User uploads Progenics TRF in LeadManagement modal

STEP 1: User clicks "Upload File" in modal
STEP 2: Browser file picker opens, user selects "document.pdf" (2MB)
STEP 3: Frontend code:
        const formData = new FormData();
        formData.append('file', document.pdf);
        fetch('/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=lead-123', {
          method: 'POST',
          body: formData
        })

STEP 4: Server receives multipart request
        Multer saves to temp location: /tmp/xyz.pdf

STEP 5: Route handler runs:
        - Gets category = 'Progenics_TRF'
        - Gets entityId = 'lead-123'
        - Calls handleFileUpload(file, 'Progenics_TRF')

STEP 6: handleFileUpload() executes:
        - Validates file (size, MIME type, etc.)
        - Gets folder: getCategoryFolder('Progenics_TRF')
        - Generates name: '1764259675840-document.pdf'
        - Moves: /tmp/xyz.pdf → uploads/Progenics_TRF/1764259675840-document.pdf
        - Returns: { success: true, filePath: 'uploads/Progenics_TRF/...' }

STEP 7: Storage layer records upload:
        INSERT INTO file_uploads (
          id: 'uuid...',
          filename: '1764259675840-document.pdf',
          original_name: 'document.pdf',
          storage_path: 'uploads/Progenics_TRF/1764259675840-document.pdf',
          category: 'Progenics_TRF',
          file_size: 2097152,
          mime_type: 'application/pdf',
          uploaded_by: 'user@example.com',
          related_entity_type: 'lead',
          related_entity_id: 'lead-123',
          created_at: NOW()
        )

STEP 8: Server responds to frontend:
        {
          "success": true,
          "filePath": "uploads/Progenics_TRF/1764259675840-document.pdf",
          "filename": "1764259675840-document.pdf",
          "uploadId": "uuid...",
          "fileSize": 2097152,
          "mimeType": "application/pdf"
        }

STEP 9: Frontend saves filePath:
        setLead(prev => ({
          ...prev,
          progenics_trf: 'uploads/Progenics_TRF/1764259675840-document.pdf'
        }))
        // Later: updateLead() API call

STEP 10: User can now:
         - See the file in upload history
         - Download it via /uploads/Progenics_TRF/...
         - Query all lead uploads via /api/uploads/entity/lead/lead-123

✅ FILE SUCCESSFULLY ORGANIZED AND TRACKED!
```

---

## Performance Characteristics

| Operation | Time | Notes |
|-----------|------|-------|
| Upload small file (1MB) | ~100ms | Multer parse + move + DB insert |
| Upload large file (50MB) | ~2s | I/O bound, network dependent |
| Query uploads by category | ~10ms | Index on `category` column |
| Query uploads by entity | ~15ms | Index on `entity_type`, `entity_id` |
| Download file | ~50ms | Static file serve, network dependent |

---

## Scaling Considerations

**Current Setup (File System Storage):**
- Good for: < 100GB of files, single server
- Backup: Copy `uploads/` folder periodically
- Disaster recovery: Restore from backup

**Future: Cloud Storage (S3/GCS):**
- Replace file move with S3 upload
- Update storage_path to S3 URL
- No file system size limits
- Automatic backups

See TODO in FILE_UPLOAD_SYSTEM_GUIDE.md for upgrade path.


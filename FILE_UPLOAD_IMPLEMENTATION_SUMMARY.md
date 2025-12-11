# File Upload System - Implementation Summary

## Quick Reference

### What Was Implemented

A **complete, reusable file upload system** that:
1. ✅ Routes files to category-specific folders automatically
2. ✅ Stores upload metadata in a database table
3. ✅ Provides API endpoints to upload and retrieve files
4. ✅ Can be used by ANY modal box in the application
5. ✅ Automatically creates required directories on startup

---

## Files Created / Modified

### 1. **Database Migration**
**File:** `database/migrations/0025_create_file_uploads_tracking.sql`

Creates the `file_uploads` table to track all uploaded files with:
- UUID, filename, original name, storage path
- Category (Progenics_TRF, Thirdparty_TRF, etc.)
- File size, MIME type, uploader ID
- Related entity type/ID for linking to leads, samples, etc.
- Timestamps and soft delete flag

### 2. **Upload Handler Utility**
**File:** `server/lib/uploadHandler.ts`

Core utility functions:
- `ensureUploadDirectories()` - Creates all category folders on startup
- `getCategoryFolder(category)` - Returns the correct folder path
- `validateFile(file)` - Validates uploaded file
- `handleFileUpload(file, category)` - **Main handler function** that processes and saves files
- `sanitizeFilename()` - Removes special characters from filenames
- `generateUniqueFilename()` - Creates unique timestamp-based filenames

**Key Feature:** All upload logic is in ONE reusable function that can be called from anywhere.

### 3. **Storage Layer**
**File:** `server/storage.ts` (modified)

Added 4 new methods to `DBStorage` class:
- `createFileUpload()` - Insert upload record into database
- `getFileUploadsByCategory()` - Fetch uploads by category
- `getFileUploadsByEntity()` - Fetch uploads linked to a specific record
- `getFileUploadById()` - Fetch single upload record

### 4. **API Routes**
**File:** `server/routes.ts` (modified)

**New Endpoints:**

1. **Upload Endpoint**
   ```
   POST /api/uploads/categorized
   ?category=Progenics_TRF&entityType=lead&entityId=lead123
   ```
   - Main upload handler used by all modal boxes
   - Auto-routes to correct folder
   - Stores metadata in database
   - Returns: `{ success, filePath, filename, uploadId, ... }`

2. **Query Endpoints**
   ```
   GET /api/uploads/category/Progenics_TRF
   GET /api/uploads/entity/lead/lead123
   ```
   - Retrieve upload history for a category or entity

### 5. **Documentation**
**File:** `FILE_UPLOAD_SYSTEM_GUIDE.md` (this directory)

Complete guide with:
- Architecture overview
- Database schema
- All API endpoints
- React component examples
- Usage examples from different scenarios
- Troubleshooting

---

## Folder Structure

After deployment, your `uploads/` directory will be organized as:

```
uploads/
├── Progenics_TRF/           ← Created automatically
│   ├── 1764259675840-doc.pdf
│   └── 1764259675842-doc.pdf
├── Thirdparty_TRF/          ← Created automatically
│   └── 1764259675843-doc.pdf
├── Progenics_Report/        ← Created automatically
│   └── 1764259675844-doc.pdf
└── Thirdparty_Report/       ← Created automatically
    └── 1764259675845-doc.pdf
```

All directories are created automatically on server startup via `ensureUploadDirectories()`.

---

## How to Use

### For Backend Developers

Simply import and call `handleFileUpload()`:

```typescript
import { handleFileUpload } from './lib/uploadHandler';

const result = handleFileUpload(file, 'Progenics_TRF', userId);
if (result.success) {
  const filePath = result.filePath;  // e.g., "uploads/Progenics_TRF/123456-file.pdf"
}
```

### For Frontend Developers

Use the new `/api/uploads/categorized` endpoint from any modal:

```typescript
const formData = new FormData();
formData.append('file', file);

const response = await fetch(
  `/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=${leadId}`,
  { method: 'POST', body: formData }
);

const result = await response.json();
// result.success = true/false
// result.filePath = "uploads/Progenics_TRF/..."
// result.uploadId = UUID of tracking record
```

---

## Database Schema Summary

```sql
CREATE TABLE file_uploads (
  id              VARCHAR(36) PRIMARY KEY,        -- UUID
  filename        VARCHAR(255) NOT NULL,          -- Sanitized
  original_name   VARCHAR(255),                   -- From browser
  storage_path    VARCHAR(500) NOT NULL,          -- Full path
  category        VARCHAR(100) NOT NULL,          -- Routing category
  file_size       BIGINT,                         -- Bytes
  mime_type       VARCHAR(100),                   -- e.g., application/pdf
  uploaded_by     VARCHAR(255),                   -- User ID
  related_entity_type VARCHAR(100),               -- lead, sample, etc.
  related_entity_id   VARCHAR(255),               -- ID of entity
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,
  is_deleted      TINYINT(1) DEFAULT 0,           -- Soft delete
  
  INDEX idx_category (category),
  INDEX idx_related_entity (related_entity_type, related_entity_id),
  INDEX idx_created_at (created_at)
);
```

---

## Supported Categories

The system automatically routes files to these folders:

| Category | Folder | Use Case |
|----------|--------|----------|
| `Progenics_TRF` | `uploads/Progenics_TRF/` | Progenics Test Request Form uploads |
| `Thirdparty_TRF` | `uploads/Thirdparty_TRF/` | Third-party TRF uploads |
| `Progenics_Report` | `uploads/Progenics_Report/` | Progenics lab reports |
| `Thirdparty_Report` | `uploads/Thirdparty_Report/` | Third-party reports |

Adding new categories is simple - just add to the `CATEGORY_FOLDER_MAP` in `uploadHandler.ts`.

---

## Implementation Flow

```
User uploads file from modal
        ↓
Frontend calls POST /api/uploads/categorized?category=Progenics_TRF
        ↓
multer middleware saves file temporarily to disk
        ↓
Route handler calls handleFileUpload(file, category)
        ↓
handleFileUpload():
  - Validates file
  - Gets correct folder (getCategoryFolder)
  - Moves file to category-specific folder
  - Returns { success, filePath, ... }
        ↓
Route handler stores metadata in database via storage.createFileUpload()
        ↓
Returns JSON response with:
  - success (true/false)
  - filePath (for storing in lead/sample record)
  - uploadId (for future reference)
  - fileSize, mimeType, etc.
        ↓
Frontend saves filePath in lead/sample record
Frontend can query uploads via GET /api/uploads/entity/...
```

---

## Next Steps

1. **Apply Database Migration:**
   ```bash
   mysql -u root -p lead_lims2 < database/migrations/0025_create_file_uploads_tracking.sql
   ```

2. **Update Modal Components:**
   Replace existing upload handlers with calls to `/api/uploads/categorized`
   
   Example targets:
   - `LeadManagement.tsx` - Progenics TRF upload
   - `LeadManagement.tsx` - Progenics Report upload
   - `ProcessMaster.tsx` - TRF uploads
   - `Bioinformatics.tsx` - Report uploads
   - etc.

3. **Test Upload Flow:**
   - Upload a file from a modal
   - Check that file appears in correct `uploads/Category/` folder
   - Verify metadata stored in `file_uploads` table
   - Query uploads via `/api/uploads/category/Progenics_TRF`

4. **Update Frontend Components:**
   - Replace hardcoded upload URLs with API responses
   - Use `uploadId` to track file relationships
   - Display upload history via `/api/uploads/entity/...` endpoint

---

## Example: Updating a Modal Component

**Before (old way):**
```typescript
// Hardcoded to /api/uploads/trf
const response = await fetch('/api/uploads/trf', {
  method: 'POST',
  body: formData
});
const { url } = await response.json();
setLeadData({ progenics_trf: url });
```

**After (new way):**
```typescript
// Uses category-based routing
const response = await fetch(
  `/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=${leadId}`,
  { method: 'POST', body: formData }
);
const { success, filePath, uploadId } = await response.json();
if (success) {
  setLeadData({ progenics_trf: filePath });
  // Optionally store uploadId for audit trail
}
```

---

## Files Modified Summary

| File | Changes |
|------|---------|
| `server/lib/uploadHandler.ts` | **NEW** - Core upload logic |
| `database/migrations/0025_create_file_uploads_tracking.sql` | **NEW** - DB schema |
| `FILE_UPLOAD_SYSTEM_GUIDE.md` | **NEW** - Complete documentation |
| `server/storage.ts` | Added 4 upload tracking methods |
| `server/routes.ts` | Added `ensureUploadDirectories()` call + 3 new endpoints |

---

## Key Advantages

✅ **Single Source of Truth** - All upload logic in one reusable function
✅ **Automatic Organization** - Files saved to correct folder by category
✅ **Audit Trail** - Every upload tracked with who, when, what
✅ **Scalable** - Easy to add new categories without changing code
✅ **Entity Linking** - Link uploads to leads, samples, or any entity
✅ **Query API** - Retrieve upload history by category or entity
✅ **No Breaking Changes** - Old endpoints (`/api/uploads/trf`) still work
✅ **Ready for Modal Integration** - Works with any modal in the system

---

## Questions?

Refer to `FILE_UPLOAD_SYSTEM_GUIDE.md` for:
- Detailed API documentation
- React component examples
- Troubleshooting guide
- Architecture deep dive


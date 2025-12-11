# File Upload System - Complete Implementation Guide

## Overview
A unified, reusable file upload system that automatically routes uploaded files to category-specific folders and tracks uploads in the database.

---

## Architecture & Components

### 1. **Upload Handler Utility** (`server/lib/uploadHandler.ts`)

The core utility that handles file routing, validation, and storage.

```typescript
// Key Functions:

// Initialize all upload directories on app startup
ensureUploadDirectories(): void

// Get the folder path for a category
getCategoryFolder(category: string): string

// Validate uploaded file
validateFile(file, maxSize?): { valid: boolean; error?: string }

// Core handler - processes and saves file
handleFileUpload(file, category, userId?): { 
  success, 
  filePath,     // e.g., "uploads/Progenics_TRF/1764259675840-file.pdf"
  filename,     // e.g., "1764259675840-file.pdf"
  message,
  category,
  fileSize,
  mimeType
}
```

### 2. **Category-to-Folder Mapping**

```typescript
{
  'Progenics_TRF': 'uploads/Progenics_TRF/',
  'Thirdparty_TRF': 'uploads/Thirdparty_TRF/',
  'Progenics_Report': 'uploads/Progenics_Report/',
  'Thirdparty_Report': 'uploads/Thirdparty_Report/'
}
```

Directories are **automatically created on server startup**.

### 3. **Database Schema** (`file_uploads` Table)

```sql
CREATE TABLE `file_uploads` (
  `id` varchar(36) NOT NULL,                    -- UUID
  `filename` varchar(255) NOT NULL,             -- Sanitized filename
  `original_name` varchar(255),                 -- Original filename from client
  `storage_path` varchar(500) NOT NULL,         -- Full path: uploads/Category/filename
  `category` varchar(100) NOT NULL,             -- File category
  `file_size` bigint,                           -- Size in bytes
  `mime_type` varchar(100),                     -- e.g., application/pdf
  `uploaded_by` varchar(255),                   -- User ID of uploader
  `related_entity_type` varchar(100),           -- e.g., 'lead', 'sample'
  `related_entity_id` varchar(255),             -- ID of related entity
  `created_at` datetime,
  `updated_at` datetime,
  `is_deleted` tinyint(1),                      -- Soft delete flag
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_related_entity` (`related_entity_type`, `related_entity_id`)
);
```

### 4. **Storage Layer Methods** (`server/storage.ts`)

```typescript
// Create upload record in database
async createFileUpload(uploadData): Promise<any>

// Get uploads by category
async getFileUploadsByCategory(category: string): Promise<any[]>

// Get uploads for a specific entity
async getFileUploadsByEntity(entityType: string, entityId: string): Promise<any[]>

// Get single upload by ID
async getFileUploadById(id: string): Promise<any>
```

---

## API Endpoints

### **Primary Upload Endpoint**

```
POST /api/uploads/categorized?category=<category>[&entityType=<type>&entityId=<id>]
```

**Parameters:**
- `category` (required, query): One of:
  - `Progenics_TRF`
  - `Thirdparty_TRF`
  - `Progenics_Report`
  - `Thirdparty_Report`
- `entityType` (optional, query): Type of entity (e.g., 'lead', 'sample')
- `entityId` (optional, query): ID of related entity

**Body:** `multipart/form-data` with `file` field

**Response (Success):**
```json
{
  "success": true,
  "filePath": "uploads/Progenics_TRF/1764259675840-document.pdf",
  "filename": "1764259675840-document.pdf",
  "message": "File uploaded successfully to Progenics_TRF folder",
  "category": "Progenics_TRF",
  "fileSize": 2048576,
  "mimeType": "application/pdf",
  "uploadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Error description"
}
```

---

### **Retrieve Upload Metadata**

```
GET /api/uploads/category/:category
```
Returns all uploads for a category.

```json
{
  "success": true,
  "category": "Progenics_TRF",
  "uploads": [
    {
      "id": "uuid",
      "filename": "1764259675840-document.pdf",
      "original_name": "document.pdf",
      "storage_path": "uploads/Progenics_TRF/1764259675840-document.pdf",
      "category": "Progenics_TRF",
      "file_size": 2048576,
      "mime_type": "application/pdf",
      "uploaded_by": "user123",
      "created_at": "2025-12-10T14:30:00Z"
    }
  ],
  "total": 1
}
```

---

```
GET /api/uploads/entity/:entityType/:entityId
```
Returns all uploads linked to a specific entity.

```json
{
  "success": true,
  "entityType": "lead",
  "entityId": "lead-001",
  "uploads": [...],
  "total": 5
}
```

---

## Usage Examples

### **Example 1: Upload a Progenics TRF from React**

```typescript
// In a modal or form component
async function uploadTRF(file: File, leadId: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `/api/uploads/categorized?category=Progenics_TRF&entityType=lead&entityId=${leadId}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const result = await response.json();
  
  if (result.success) {
    console.log('Upload successful!');
    console.log('File path:', result.filePath);
    console.log('Upload ID:', result.uploadId);
    
    // Save the filePath or uploadId to your database record
    // e.g., lead.progenics_trf = result.filePath
  } else {
    console.error('Upload failed:', result.message);
  }
}
```

### **Example 2: Upload Thirdparty Report**

```typescript
async function uploadThirdpartyReport(file: File, sampleId: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `/api/uploads/categorized?category=Thirdparty_Report&entityType=sample&entityId=${sampleId}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  const result = await response.json();
  return result;
}
```

### **Example 3: Retrieve All Uploads for a Lead**

```typescript
async function getLeadUploads(leadId: string) {
  const response = await fetch(`/api/uploads/entity/lead/${leadId}`);
  const data = await response.json();
  
  if (data.success) {
    // data.uploads contains all files linked to this lead
    const trfs = data.uploads.filter(u => u.category === 'Progenics_TRF');
    const reports = data.uploads.filter(u => u.category === 'Progenics_Report');
    
    return { trfs, reports };
  }
}
```

### **Example 4: Create a Reusable Upload Component**

```typescript
// components/CategoryFileUpload.tsx
interface CategoryFileUploadProps {
  category: 'Progenics_TRF' | 'Thirdparty_TRF' | 'Progenics_Report' | 'Thirdparty_Report';
  entityType?: string;
  entityId?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function CategoryFileUpload({
  category,
  entityType,
  entityId,
  onSuccess,
  onError,
}: CategoryFileUploadProps) {
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      let url = `/api/uploads/categorized?category=${category}`;
      if (entityType) url += `&entityType=${entityType}`;
      if (entityId) url += `&entityId=${entityId}`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.(result);
      } else {
        onError?.(result.message);
      }
    } catch (error) {
      onError?.((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={handleUpload}
        disabled={loading}
        accept=".pdf,.doc,.docx"
      />
      {loading && <p>Uploading...</p>}
    </div>
  );
}

// Usage in a modal:
<CategoryFileUpload
  category="Progenics_TRF"
  entityType="lead"
  entityId={leadId}
  onSuccess={(result) => {
    console.log('File uploaded:', result.filePath);
    // Update lead with new TRF path
  }}
  onError={(error) => {
    console.error('Upload failed:', error);
  }}
/>
```

---

## File Organization on Disk

After uploads, your `uploads/` directory will look like:

```
uploads/
├── Progenics_TRF/
│   ├── 1764259675840-document1.pdf
│   ├── 1764259675842-document2.pdf
│   └── ...
├── Thirdparty_TRF/
│   ├── 1764259675843-thirdparty.pdf
│   └── ...
├── Progenics_Report/
│   ├── 1764259675844-report1.pdf
│   └── ...
├── Thirdparty_Report/
│   ├── 1764259675845-report2.pdf
│   └── ...
└── [other old files - not organized by category]
```

---

## Key Features

✅ **Automatic Folder Routing** - Files automatically save to the correct category folder
✅ **Reusable Handler** - Single upload handler used by ALL modal boxes
✅ **Database Tracking** - Every upload stored with metadata (size, MIME type, uploader, timestamp)
✅ **Entity Linking** - Link uploads to specific records (leads, samples, etc.)
✅ **Soft Delete** - Mark uploads as deleted without removing files
✅ **Query Interface** - Retrieve uploads by category or entity
✅ **Directory Auto-Create** - All folders created on server startup
✅ **Error Handling** - Comprehensive validation and error messages

---

## Database Migration

To apply the schema:

```bash
mysql -u root -p lead_lims2 < database/migrations/0025_create_file_uploads_tracking.sql
```

Or use your migration tool to apply the SQL file.

---

## Implementation Checklist

- [x] Create `uploadHandler.ts` utility
- [x] Create migration SQL file for `file_uploads` table
- [x] Add storage methods for upload tracking
- [x] Create `/api/uploads/categorized` endpoint
- [x] Create `/api/uploads/category/:category` endpoint
- [x] Create `/api/uploads/entity/:entityType/:entityId` endpoint
- [ ] Update modal components to use new endpoint
- [ ] Test uploads from all modal boxes
- [ ] Verify folder organization in `uploads/` directory
- [ ] Verify database tracking works correctly

---

## Troubleshooting

**Files not creating in correct folder:**
- Check that `ensureUploadDirectories()` was called on app startup
- Verify category name matches exactly (case-sensitive)
- Check file permissions on `uploads/` directory

**Database insert failing:**
- Ensure `file_uploads` table is created (run migration)
- Check database connection is working
- Verify user has INSERT permissions

**File upload returns 400 - Category parameter required:**
- Make sure `?category=` is included in the URL
- Check category value is one of the valid options

**Upload succeeds but file not visible:**
- Check file is in `uploads/[category]/` folder, not root `uploads/`
- Verify `/uploads` route is mounted in Express (`app.use('/uploads', static(...))`)
- Check browser can access via `/uploads/[category]/filename`

---

## Future Enhancements

- Add file size limits per category
- Add file type restrictions per category
- Implement file versioning (keep upload history)
- Add file preview/thumbnail generation
- Add bulk upload support
- Add S3/cloud storage integration
- Add file compression
- Add malware scanning


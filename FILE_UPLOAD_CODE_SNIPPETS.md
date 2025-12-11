# File Upload System - Copy-Paste Code Snippets

Use these ready-to-use code snippets in your modal components and pages.

---

## 1. React Upload Hook (TypeScript)

```typescript
// hooks/useFileUpload.ts
import { useState } from 'react';

interface UploadResult {
  success: boolean;
  filePath?: string;
  uploadId?: string;
  filename?: string;
  fileSize?: number;
  message: string;
}

interface UseFileUploadOptions {
  category: 'Progenics_TRF' | 'Thirdparty_TRF' | 'Progenics_Report' | 'Thirdparty_Report';
  entityType?: string;
  entityId?: string;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);

  const upload = async (file: File): Promise<UploadResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      let url = `/api/uploads/categorized?category=${options.category}`;
      if (options.entityType) url += `&entityType=${options.entityType}`;
      if (options.entityId) url += `&entityId=${options.entityId}`;

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        return data;
      } else {
        setError(data.message || 'Upload failed');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload error';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, result, upload };
}
```

**Usage:**
```typescript
const { loading, error, result, upload } = useFileUpload({
  category: 'Progenics_TRF',
  entityType: 'lead',
  entityId: leadId,
});

const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const result = await upload(file);
    if (result?.success) {
      console.log('File uploaded:', result.filePath);
      // Update your state/database
    }
  }
};
```

---

## 2. Reusable File Upload Component

```typescript
// components/FileUploadButton.tsx
import React, { useRef } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadButtonProps {
  category: 'Progenics_TRF' | 'Thirdparty_TRF' | 'Progenics_Report' | 'Thirdparty_Report';
  label?: string;
  entityType?: string;
  entityId?: string;
  accept?: string;
  onSuccess?: (filePath: string, uploadId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function FileUploadButton({
  category,
  label = 'Choose File',
  entityType,
  entityId,
  accept = '.pdf,.doc,.docx',
  onSuccess,
  onError,
  className = '',
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { loading, error, upload } = useFileUpload({
    category,
    entityType,
    entityId,
  });

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await upload(file);
      if (result?.success) {
        onSuccess?.(result.filePath!, result.uploadId!);
      } else {
        onError?.(error || 'Upload failed');
      }
    }
    // Reset input
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className="file-upload-button">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept={accept}
        style={{ display: 'none' }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className={className}
      >
        {loading ? 'Uploading...' : label}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
```

**Usage:**
```typescript
<FileUploadButton
  category="Progenics_TRF"
  label="Upload TRF"
  entityType="lead"
  entityId={leadId}
  onSuccess={(filePath, uploadId) => {
    setLead(prev => ({ ...prev, progenics_trf: filePath }));
  }}
  onError={(error) => {
    showError(error);
  }}
/>
```

---

## 3. Upload with File Preview

```typescript
// components/FileUploadWithPreview.tsx
import React, { useRef, useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';

interface FileUploadWithPreviewProps {
  category: 'Progenics_TRF' | 'Thirdparty_TRF' | 'Progenics_Report' | 'Thirdparty_Report';
  entityType?: string;
  entityId?: string;
  onFileSelect: (filePath: string, originalName: string, uploadId: string) => void;
}

export function FileUploadWithPreview({
  category,
  entityType,
  entityId,
  onFileSelect,
}: FileUploadWithPreviewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{ name: string; size: string } | null>(null);
  const { loading, error, upload } = useFileUpload({
    category,
    entityType,
    entityId,
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      setPreview({
        name: file.name,
        size: formatFileSize(file.size),
      });

      // Upload
      const result = await upload(file);
      if (result?.success) {
        onFileSelect(result.filePath!, file.name, result.uploadId!);
      }
    }
  };

  return (
    <div className="file-upload-with-preview">
      <input
        ref={inputRef}
        type="file"
        onChange={handleChange}
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
      >
        {loading ? '⏳ Uploading...' : '📎 Select File'}
      </button>

      {preview && (
        <div className="preview">
          <p>
            📄 {preview.name} ({preview.size})
          </p>
          {loading && <p style={{ color: 'orange' }}>Uploading...</p>}
        </div>
      )}

      {error && <p style={{ color: 'red' }}>❌ {error}</p>}
    </div>
  );
}
```

---

## 4. Upload History Component

```typescript
// components/UploadHistory.tsx
import { useEffect, useState } from 'react';

interface Upload {
  id: string;
  filename: string;
  original_name: string;
  storage_path: string;
  file_size: number;
  created_at: string;
}

interface UploadHistoryProps {
  entityType: string;
  entityId: string;
}

export function UploadHistory({ entityType, entityId }: UploadHistoryProps) {
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await fetch(
          `/api/uploads/entity/${entityType}/${entityId}`
        );
        const data = await response.json();

        if (data.success) {
          setUploads(data.uploads);
        } else {
          setError('Failed to load upload history');
        }
      } catch (err) {
        setError('Error fetching uploads');
      } finally {
        setLoading(false);
      }
    };

    fetchUploads();
  }, [entityType, entityId]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (uploads.length === 0) return <p>No uploads yet</p>;

  return (
    <div className="upload-history">
      <h3>Upload History</h3>
      <table>
        <thead>
          <tr>
            <th>Filename</th>
            <th>Size</th>
            <th>Uploaded</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((upload) => (
            <tr key={upload.id}>
              <td>{upload.original_name}</td>
              <td>{(upload.file_size / 1024).toFixed(2)} KB</td>
              <td>{new Date(upload.created_at).toLocaleDateString()}</td>
              <td>
                <a
                  href={`/${upload.storage_path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Usage:**
```typescript
<UploadHistory entityType="lead" entityId={leadId} />
```

---

## 5. Modal with File Upload

```typescript
// components/LeadDetailModal.tsx
import { useState } from 'react';
import { FileUploadButton } from '@/components/FileUploadButton';
import { UploadHistory } from '@/components/UploadHistory';

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
}

export function LeadDetailModal({ leadId, onClose }: LeadDetailModalProps) {
  const [lead, setLead] = useState<any>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTRFUpload = (filePath: string) => {
    setLead(prev => ({
      ...prev,
      progenics_trf: filePath,
    }));
    // Trigger upload history refresh
    setRefreshKey(prev => prev + 1);
    // Save to database
    updateLead({ progenics_trf: filePath });
  };

  const handleReportUpload = (filePath: string) => {
    setLead(prev => ({
      ...prev,
      progenics_report: filePath,
    }));
    setRefreshKey(prev => prev + 1);
    updateLead({ progenics_report: filePath });
  };

  const updateLead = async (updates: any) => {
    // Your API call to update lead
    console.log('Updating lead with:', updates);
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Lead Details</h2>

        <section>
          <h3>Progenics TRF</h3>
          <FileUploadButton
            category="Progenics_TRF"
            label="Upload TRF"
            entityType="lead"
            entityId={leadId}
            onSuccess={(filePath) => handleTRFUpload(filePath)}
            onError={(error) => alert(error)}
          />
          {lead.progenics_trf && (
            <p>
              ✅ Current: <a href={`/${lead.progenics_trf}`}>View File</a>
            </p>
          )}
        </section>

        <section>
          <h3>Progenics Report</h3>
          <FileUploadButton
            category="Progenics_Report"
            label="Upload Report"
            entityType="lead"
            entityId={leadId}
            onSuccess={(filePath) => handleReportUpload(filePath)}
            onError={(error) => alert(error)}
          />
          {lead.progenics_report && (
            <p>
              ✅ Current: <a href={`/${lead.progenics_report}`}>View File</a>
            </p>
          )}
        </section>

        <section>
          <UploadHistory key={refreshKey} entityType="lead" entityId={leadId} />
        </section>

        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
```

---

## 6. Fetch Uploads by Category

```typescript
// services/uploadService.ts
export async function getUploadsByCategory(
  category: 'Progenics_TRF' | 'Thirdparty_TRF' | 'Progenics_Report' | 'Thirdparty_Report'
) {
  try {
    const response = await fetch(`/api/uploads/category/${category}`);
    const data = await response.json();

    if (data.success) {
      return data.uploads;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to fetch uploads:', error);
    return [];
  }
}

export async function getUploadsByEntity(
  entityType: string,
  entityId: string
) {
  try {
    const response = await fetch(`/api/uploads/entity/${entityType}/${entityId}`);
    const data = await response.json();

    if (data.success) {
      return data.uploads;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('Failed to fetch uploads:', error);
    return [];
  }
}

// Usage:
// const trfFiles = await getUploadsByCategory('Progenics_TRF');
// const leadFiles = await getUploadsByEntity('lead', 'lead-123');
```

---

## 7. Form Integration

```typescript
// components/LeadForm.tsx
import { useState } from 'react';
import { FileUploadButton } from '@/components/FileUploadButton';

export function LeadForm() {
  const [formData, setFormData] = useState({
    patientName: '',
    age: '',
    progenics_trf: '',
    progenics_report: '',
  });

  const handleTRFUpload = (filePath: string) => {
    setFormData(prev => ({
      ...prev,
      progenics_trf: filePath,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // formData.progenics_trf now contains the file path
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      alert('Lead created successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Patient Name"
        value={formData.patientName}
        onChange={(e) =>
          setFormData(prev => ({ ...prev, patientName: e.target.value }))
        }
      />

      <label>
        Progenics TRF:
        <FileUploadButton
          category="Progenics_TRF"
          label={formData.progenics_trf ? '✅ File Selected' : '📎 Choose File'}
          onSuccess={(filePath) => handleTRFUpload(filePath)}
          onError={(error) => alert(error)}
        />
      </label>

      <button type="submit">Create Lead</button>
    </form>
  );
}
```

---

## 8. Error Handling Example

```typescript
// Example with comprehensive error handling
async function uploadWithErrorHandling(
  file: File,
  category: string,
  leadId: string
) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    // Validate file before upload
    if (file.size > 50 * 1024 * 1024) {
      throw new Error('File is too large (max 50MB)');
    }

    if (!['application/pdf', 'application/msword'].includes(file.type)) {
      throw new Error('Only PDF and DOC files are allowed');
    }

    // Upload
    const response = await fetch(
      `/api/uploads/categorized?category=${category}&entityType=lead&entityId=${leadId}`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Upload failed');
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Upload error:', message);
    return { success: false, message };
  }
}
```

---

## Integration Checklist

- [ ] Copy `useFileUpload` hook into your project
- [ ] Copy `FileUploadButton` component
- [ ] Import and use in your modal components
- [ ] Test upload from LeadManagement modal
- [ ] Test upload from ProcessMaster modal
- [ ] Test upload from other modals
- [ ] Verify files appear in `uploads/Category/` folders
- [ ] Verify metadata stored in `file_uploads` table
- [ ] Check that `/api/uploads/entity/...` returns correct files


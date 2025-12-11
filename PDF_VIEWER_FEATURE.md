# PDF Viewer Feature - Implementation Guide

## Overview
Added a reusable PDF viewer component that allows users to view and download TRF (Test Report Form) PDF files directly from the LeadManagement and ProcessMaster pages.

## Features
- **View PDFs**: Click on the file icon button to open a PDF in a modal dialog
- **Download PDFs**: Download PDFs directly from the viewer with a single click
- **Seamless Integration**: Works with both Progenics TRF uploads and existing PDF URLs
- **Responsive Design**: Modal dialog is responsive and handles large PDFs

## What Changed

### New Component
**File**: `client/src/components/PDFViewer.tsx`

A reusable React component that provides:
- Button to open PDF viewer modal
- PDF display using iframe
- Download button for direct file downloads
- Clean close button
- Customizable button styling and sizing

### Updated Files

#### 1. LeadManagement.tsx
- Added import for PDFViewer component
- Updated Progenics TRF table cell to use PDFViewer
  - Displays a clickable PDF icon instead of plain text
  - Shows "-" when no PDF is available
- TRF upload section already had file input (no changes needed)

#### 2. ProcessMaster.tsx  
- Added import for PDFViewer component
- Updated Progenics TRF table cell to use PDFViewer
  - Shows PDF viewer icon for any available TRF URLs
- Updated edit dialog form
  - Added PDFViewer button next to the Progenics TRF input field
  - Allows users to view existing PDFs while editing

## How It Works

### Viewing a PDF
1. Look for the **PDF icon** in the Progenics TRF column
2. Click the icon to open the PDF viewer modal
3. The PDF displays in the modal (using browser's PDF rendering)
4. Use the **Download** button to save the file locally
5. Click the **X** button to close the viewer

### File Storage
- TRF files are stored in the database as base64-encoded blobs
- Accessed via `/api/uploads/trf/:id` endpoint
- Files can be uploaded during lead creation or editing
- URL format: `/api/uploads/trf/{fileId}`

### Supported File Types
- PDF files (.pdf)
- The system can be extended to support other document types

## User Experience

### Table View
```
Progenics TRF Column:
- If PDF exists: Shows a clickable file icon
- If no PDF: Shows "-" (not available)
```

### Edit Dialog (ProcessMaster)
```
Progenics TRF Field:
[Text Input] [PDF Icon]
           └─ Only appears if PDF exists
```

## Technical Details

### PDFViewer Component Props
```typescript
interface PDFViewerProps {
  pdfUrl?: string;              // URL to the PDF file
  fileName?: string;            // Display name for the PDF
  buttonClassName?: string;     // Custom CSS classes for button
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonVariant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive';
}
```

### Browser Compatibility
- Works in all modern browsers (Chrome, Firefox, Safari, Edge)
- Uses browser's native PDF rendering via iframe
- Fallback handling for unsupported PDF types

## API Endpoints Used
- **GET** `/api/uploads/trf/:id` - Fetch PDF file from database
- **POST** `/api/uploads/trf-db` - Upload new TRF file
- **PUT** `/api/leads/:id` - Update lead with TRF URL
- **PUT** `/api/process-master/:id` - Update ProcessMaster record with TRF URL

## Testing Checklist

- [ ] Create a new lead and upload a PDF TRF file
- [ ] Verify the PDF icon appears in the LeadManagement table
- [ ] Click the icon and verify the PDF viewer opens
- [ ] Test the Download button in the PDF viewer
- [ ] Edit a lead with an existing TRF and verify the PDF viewer icon appears
- [ ] Navigate to ProcessMaster and verify PDFs are visible there as well
- [ ] Test with different PDF files to ensure compatibility
- [ ] Verify the modal closes properly when clicking X or outside

## Future Enhancements

Possible improvements:
- Add support for multiple documents (Reports, genetic counseling forms, etc.)
- Implement document preview thumbnails in table
- Add file size information
- Support for document signing/annotation
- Organize documents by type in a document management panel
- Add full-text PDF search capability

## Build & Deployment

The feature is fully integrated and builds successfully:
```
✓ built in 5.02s
dist/index.js  266.7kb
```

No additional dependencies were added - uses existing libraries:
- React Dialog (ui component)
- Lucide icons
- Browser native PDF rendering

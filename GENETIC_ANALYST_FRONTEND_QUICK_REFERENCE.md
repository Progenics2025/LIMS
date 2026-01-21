# Genetic Analyst - Frontend Integration Quick Reference

## Problem Fixed ✅

**Before:**
```
User edits record → Toast: "Record updated locally." → Data NOT in backend ❌
```

**After:**
```
User edits record → API call to backend → Toast: "Record updated successfully in backend." → Data in database ✅
```

## Key Changes Made

### 1. Import useEffect
```typescript
import { useState, useMemo, useEffect } from 'react';
```

### 2. Add Loading State
```typescript
const [loading, setLoading] = useState(true);
```

### 3. Fetch Data on Mount
```typescript
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/genetic-analyst');
      if (response.ok) {
        const data = await response.json();
        setRows(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, []);
```

### 4. Update onSave to Call Backend
```typescript
const onSave = async (formData: GeneticAnalystRecord) => {
  try {
    if (!editing?.id) {
      toast({ title: "Error", description: "No record ID found" });
      return;
    }

    // Map camelCase to match backend expectations
    const apiPayload = {
      receivedDateForAnalysis: formData.receivedDateForAnalysis || null,
      completedAnalysis: formData.completedAnalysis || null,
      analyzedBy: formData.analyzedBy || null,
      reviewerComments: formData.reviewerComments || null,
      reportPreparationDate: formData.reportPreparationDate || null,
      reportReviewDate: formData.reportReviewDate || null,
      reportReleaseDate: formData.reportReleaseDate || null,
      remarks: formData.remarks || null,
      modifiedBy: user?.id || 'system'
    };

    // Send to backend
    const response = await fetch(`/api/genetic-analyst/${editing.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(apiPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      toast({ title: "Error", description: error.message || "Failed to update record" });
      return;
    }

    // Update local state with backend response
    const updatedRecord = await response.json();
    setRows(rows.map(r => r.id === editing.id ? updatedRecord : r));

    setIsOpen(false);
    setEditing(null);
    toast({ title: "Saved", description: "Record updated successfully in backend." });
  } catch (error) {
    console.error("Failed to save:", error);
    toast({ title: "Error", description: "Failed to update record in backend" });
  }
};
```

### 5. Update handleDelete to Call Backend
```typescript
const handleDelete = async (id: string) => {
  // Add to recycle bin
  try {
    const item = rows.find(r => r.id === id);
    if (item) {
      add({ entityType: 'genetic_analyst', entityId: id, name: item.uniqueId ?? item.sampleId ?? id, originalPath: '/genetic-analyst', data: item });
    }
  } catch (err) {
    console.error("Failed to recycle", err);
  }

  // Delete from backend
  try {
    const response = await fetch(`/api/genetic-analyst/${id}`, { method: 'DELETE' });
    if (response.ok) {
      setRows(rows.filter(r => r.id !== id));
      toast({ title: "Deleted", description: "Record has been deleted." });
    } else {
      toast({ title: "Error", description: "Failed to delete record" });
    }
  } catch (error) {
    console.error("Failed to delete record", error);
    toast({ title: "Error", description: "Failed to delete record" });
  }
};
```

### 6. Add Loading UI
```typescript
{loading ? (
  <div className="p-8 text-center text-muted-foreground">
    Loading genetic analyst records...
  </div>
) : (
  <>
    {/* Existing content */}
  </>
)}
```

## API Calls Made

### Load Records (on component mount)
```
GET /api/genetic-analyst
Response: Array of records
```

### Update Record (on save)
```
PUT /api/genetic-analyst/:id
Body: {
  receivedDateForAnalysis: "2026-01-21",
  completedAnalysis: "2026-01-21",
  analyzedBy: "Dr. Smith",
  reviewerComments: "...",
  reportPreparationDate: "...",
  reportReviewDate: "...",
  reportReleaseDate: "...",
  remarks: "...",
  modifiedBy: "user-id"
}
Response: Updated record object
```

### Delete Record (on delete)
```
DELETE /api/genetic-analyst/:id
Response: { message: "...", deletedRecord: {...} }
```

## Field Mapping (Frontend → Backend)

| Frontend | Backend | Type |
|----------|---------|------|
| receivedDateForAnalysis | receivedDateForAnalysis | date string |
| completedAnalysis | completedAnalysis | date string |
| analyzedBy | analyzedBy | string |
| reviewerComments | reviewerComments | text |
| reportPreparationDate | reportPreparationDate | date string |
| reportReviewDate | reportReviewDate | date string |
| reportReleaseDate | reportReleaseDate | date string |
| remarks | remarks | text |
| (automatic) | modifiedBy | user ID |

## Toast Notifications

### Success Cases
- Update: "Saved" - "Record updated successfully in backend."
- Delete: "Deleted" - "Record has been deleted."

### Error Cases
- Update error: "Error" - "[Error message]"
- Delete error: "Error" - "Failed to delete record"
- No record ID: "Error" - "No record ID found"

## Testing Checklist

- [ ] Page loads with loading state
- [ ] Records appear after loading
- [ ] Click Edit button
- [ ] Change one field
- [ ] Click Save
- [ ] See "Record updated successfully in backend." toast
- [ ] Check browser DevTools Network tab - PUT request sent
- [ ] Check database - value is updated
- [ ] Click Delete button
- [ ] See "Record has been deleted." toast
- [ ] Record removed from table
- [ ] Check database - record is gone

## Summary of Changes

✅ **Data now flows:** Form → Backend API → Database → Frontend display
✅ **User tracking:** modifiedBy is set to current user
✅ **Error handling:** Proper error messages shown to user
✅ **Loading state:** UI shows loading while fetching
✅ **No more local-only saves:** Everything goes to backend

---

**Status:** ✅ Ready for testing

# Table Column Customization Feature

## Summary
This update adds column visibility controls to all major table sections in the LIMS application. Users can now personalize which columns are visible in their tables, with preferences saved per user in localStorage.

## Supported Pages

The column customization feature has been implemented on the following pages:

| Page | Table ID | # of Columns |
|------|----------|--------------|
| Bioinformatics | `bioinformatics_table` | 42 columns |
| Finance Management | `finance_management_table` | 46 columns |
| Lead Management | `lead_management_table` | 42 columns |
| Lab Processing | `lab_processing_table` | 29 columns |
| Sample Tracking | `sample_tracking_table` | 26 columns |
| Report Management | `report_management_table` | 31 columns |
| Genetic Counselling | `genetic_counselling_table` | 41 columns |
| Process Master | `process_master_table` | 40 columns |
| Nutrition | `nutrition_table` | 25 columns |

## Changes Made

### 1. New Components and Hooks Created

#### `client/src/hooks/useColumnPreferences.ts`
A reusable hook for managing column visibility and ordering preferences:
- Stores preferences in localStorage per user ID
- Supports column hiding/showing
- Persists user choices across sessions
- Provides utilities: `toggleColumn`, `showAllColumns`, `showCompactView`, `resetToDefaults`

#### `client/src/components/ColumnSettings.tsx`
A dropdown component for toggling column visibility:
- Shows count of visible vs total columns
- Quick buttons for "Compact" and "Show All"
- Dropdown with checkboxes for individual column toggles
- Visual indicators (eye icons) for column state

#### `client/src/components/ConfigurableDataTable.tsx`
A more advanced reusable table component (optional use):
- Supports drag-and-drop column reordering
- Built-in column visibility controls
- Per-user preference persistence

### 2. Pages Updated

Each page now includes:
1. **Column Configuration Array** - Defines all columns with `id`, `label`, `canHide`, and `defaultVisible` properties
2. **useColumnPreferences Hook** - Manages user preferences for that table
3. **ColumnSettings Component** - UI for toggling columns (placed after FilterBar)

## How It Works

### User Experience
1. Users see a toolbar above tables showing "X of Y columns"
2. Click "Columns" button to open dropdown
3. Toggle individual columns on/off with checkboxes
4. Use "Compact" for essential columns only
5. Use "Show All" to display everything
6. Use "Reset" to restore defaults

### Data Persistence
- Preferences are stored in localStorage
- Key format: `lims_col_prefs_{tableId}_{userId}`
- Preferences survive page refreshes and browser sessions
- Each user has their own preferences

## Column Visibility Defaults

Columns are configured with sensible defaults:
- **Always Visible** (`canHide: false`): Unique ID, Actions
- **Default Visible**: Key identification and status fields  
- **Default Hidden**: Contact details, metadata, less frequently used fields

## Technical Notes

1. **Performance**: Column visibility checks are simple boolean lookups, minimal performance impact
2. **Backward Compatibility**: New users see sensible defaults; existing pages work unchanged
3. **Robustness**: If new columns are added to the system, they appear in user views by default
4. **Maintainability**: Column definitions are centralized arrays, easy to update

## Files Modified
- `client/src/pages/Bioinformatics.tsx`
- `client/src/pages/FinanceManagement.tsx`
- `client/src/pages/LeadManagement.tsx`
- `client/src/pages/LabProcessing.tsx`
- `client/src/pages/SampleTracking.tsx`
- `client/src/pages/ReportManagement.tsx`
- `client/src/pages/GeneticCounselling.tsx`
- `client/src/pages/ProcessMaster.tsx`
- `client/src/pages/Nutrition.tsx`

## Files Created
- `client/src/hooks/useColumnPreferences.ts` - Column preference management hook
- `client/src/components/ColumnSettings.tsx` - Column toggle UI component
- `client/src/components/ConfigurableDataTable.tsx` - Advanced table component (optional)

## Usage Example

To add column customization to a new table page:

```tsx
import { useMemo } from 'react';
import { useColumnPreferences, ColumnConfig } from '@/hooks/useColumnPreferences';
import { ColumnSettings } from '@/components/ColumnSettings';

// Inside your component:
const columns: ColumnConfig[] = useMemo(() => [
  { id: 'uniqueId', label: 'Unique ID', canHide: false },
  { id: 'projectId', label: 'Project ID', defaultVisible: true },
  { id: 'details', label: 'Details', defaultVisible: false },
  { id: 'actions', label: 'Actions', canHide: false },
], []);

const columnPrefs = useColumnPreferences('your_table_id', columns);

// In JSX - add after FilterBar:
<ColumnSettings
  columns={columns}
  isColumnVisible={columnPrefs.isColumnVisible}
  toggleColumn={columnPrefs.toggleColumn}
  resetToDefaults={columnPrefs.resetToDefaults}
  showAllColumns={columnPrefs.showAllColumns}
  showCompactView={columnPrefs.showCompactView}
  visibleCount={columnPrefs.visibleCount}
  totalCount={columnPrefs.totalCount}
/>

// Use columnPrefs.isColumnVisible('columnId') to conditionally render columns
```

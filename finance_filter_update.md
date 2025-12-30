# Finance Filter and Readability Update

## Features Added
1.  **Advanced Filter Bar**:
    *   **Global Search**: Searches through all data fields in the finance records.
    *   **Date Range Filter**: Allows filtering records by a custom date range.
    *   **Date Field Selector**: Users can choose which date field to filter by (e.g., Created Date, Sample Collection Date, Invoice Date).
    *   **Clear Filters**: A button to quickly reset search and date filters.

2.  **Improved Readability**:
    *   **Sticky Unique ID**: The "Unique ID" column is now sticky on the left side of the table, ensuring context is maintained while scrolling through the many columns.
    *   **Visual Separation**: Added a shadow and border to the sticky column for better visual separation.

## Technical Details
- **Components Used**: `Calendar`, `Popover`, `Select` from `shadcn/ui`.
- **Logic**: 
    - `filteredFinanceRows` now checks `Object.values(record)` for the search query.
    - Date filtering compares the selected date field's value against the selected `dateRange`.

## Verification
- Check the "Finance Management" page.
- Verify the new Filter Bar appears above the "Finance Records" table.
- Test searching for values in various columns (e.g., "Pending", "Dr. Smith").
- Test filtering by a date range using the Date Picker.
- Scroll the table horizontally and verify the "Unique ID" column stays fixed.

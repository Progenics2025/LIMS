# Genetic Counselling Action Button with Stages & Auto Project ID Generation - COMPLETE

## Overview
Added an Action button to the Genetic Counselling component with stage workflow similar to Lead Management. When a GC record transitions to "Completed" stage, a Project ID with "GC" prefix is automatically generated.

## Changes Made

### 1. Frontend: GeneticCounselling.tsx

**Imports Added:**
- `Badge` component for stage display
- `useMutation` from react-query for status updates

**Helper Functions:**
- `getStageBadgeColor(stage)`: Returns CSS classes for stage badge coloring
  - Not Started: Gray
  - In Progress: Blue
  - Completed: Green

- `getNextStage(currentStage)`: Returns the next stage in the workflow
  - Not Started → In Progress
  - In Progress → Completed
  - Completed → None (final stage)

**Mutation:**
- `updateGCStatusMutation`: Updates GC record's `testing_status` and optionally `project_id`
  - Calls `PUT /api/genetic-counselling-sheet/:id`
  - Sends `testing_status` and `project_id` (if generated)

**Event Handler:**
- `handleStageChange(recordId, newStage)`: 
  - If transitioning to "Completed", calls `/api/genetic-counselling/generate-project-id` to get GC-prefixed Project ID
  - Calls mutation to update database

**Table Cell:**
- Actions column now displays:
  1. Stage Badge (displays current testing_status)
  2. Action Button (shows next stage, disabled when stage is Completed)
  3. Edit Button
  4. Delete Button

### 2. Backend: server/routes.ts

**New Endpoint:**
```typescript
POST /api/genetic-counselling/generate-project-id
```
- Generates a Project ID with "GC" prefix
- Uses `generateProjectId('genetic-counselling')` function
- Returns: `{ project_id: "GCYYMMDDHHMMSS" }`
- Example: `GC260128162530`

### 3. Backend: server/lib/generateProjectId.ts

**Updated getPrefix() Function:**
- Added support for 'genetic-counselling' and 'gc' categories
- Returns 'GC' prefix for Genetic Counselling projects
- Maintains backward compatibility for existing categories (PG, DG, CL)

**Updated Documentation:**
- Added GC prefix to the supported prefix mapping in comments

## Stage Workflow

```
Not Started
    ↓
    [⏳ In Progress] button
    ↓
In Progress
    ↓
    [✅ Completed] button
    ↓
Completed (No more buttons, Project ID generated and stored)
```

## Project ID Format

### Format: `GCYYMMDDHHMMSS`

Example: `GC260128162530`

Breakdown:
- `GC` = Genetic Counselling prefix
- `26` = Year 2026
- `01` = January
- `28` = 28th day
- `16` = 16:00 hours
- `25` = 25 minutes
- `30` = 30 seconds

## Database Schema

**genetic_counselling_records table:**
- `testing_status` (VARCHAR): Stores stage value ("Not Started", "In Progress", "Completed")
- `project_id` (VARCHAR): Stores auto-generated Project ID (populated when stage = Completed)

## Behavior

1. **New GC Record Creation:**
   - `testing_status` defaults to NULL (displays as "Not Started" in UI)

2. **Stage Progression:**
   - User clicks stage button to advance to next stage
   - Stage value is immediately updated in database
   - Row color changes: Gray → Blue → Green

3. **Completed Transition:**
   - When transitioning to "Completed":
     - Client calls `/api/genetic-counselling/generate-project-id`
     - Server generates unique Project ID with "GC" prefix
     - Client sends both `testing_status: "Completed"` and `project_id` to backend
     - Backend updates record with both values
   - No more stage buttons appear (final state)

## Code Locations

- **Client Stage Logic**: [client/src/pages/GeneticCounselling.tsx](client/src/pages/GeneticCounselling.tsx)
  - Imports (lines 1-24)
  - Helper functions (lines ~296-342)
  - Mutation definition (lines ~344-365)
  - Event handler (lines ~367-384)
  - Table cell rendering (lines ~775-808)

- **Backend Endpoint**: [server/routes.ts](server/routes.ts)
  - Line 4158: POST `/api/genetic-counselling/generate-project-id`

- **Project ID Generation**: [server/lib/generateProjectId.ts](server/lib/generateProjectId.ts)
  - Line 30: Updated `getPrefix()` function to support "genetic-counselling" category
  - Line 1: Updated documentation comment

## API Endpoints

### Get GC Records
```
GET /api/genetic-counselling-sheet
Response: Array<GCRecord>
```

### Create GC Record
```
POST /api/genetic-counselling-sheet
Body: GCRecord
Response: { id, ... }
```

### Update GC Record (including stage & project_id)
```
PUT /api/genetic-counselling-sheet/:id
Body: { testing_status: "Completed", project_id: "GC260128162530" }
Response: Updated GCRecord
```

### Generate GC Project ID
```
POST /api/genetic-counselling/generate-project-id
Response: { project_id: "GCYYMMDDHHMMSS" }
```

### Delete GC Record
```
DELETE /api/genetic-counselling-sheet/:id
Response: { success: true }
```

## UI/UX Features

1. **Stage Badge Colors:**
   - Gray: Not Started
   - Blue: In Progress
   - Green: Completed

2. **Action Button Text:**
   - "⏳ In Progress" when advancing to In Progress
   - "✅ Completed" when advancing to Completed

3. **Loading State:**
   - Button disabled while mutation is pending
   - Shows loading state during Project ID generation

4. **Error Handling:**
   - Toast notification on successful update
   - Toast with error message on failure
   - Console warning if Project ID generation fails (fallback: update stage only)

## Testing Checklist

- [ ] Create new GC record → testing_status defaults to "Not Started"
- [ ] Click "⏳ In Progress" button → stage updates to "In Progress", row color changes to blue
- [ ] Click "✅ Completed" button → 
  - [ ] Project ID is generated (format: GCYYMMDDHHmmss)
  - [ ] Stage updates to "Completed", row color changes to green
  - [ ] No more stage buttons appear
- [ ] Verify Project ID persists after page refresh
- [ ] Test with multiple GC records → each gets unique Project ID
- [ ] Verify sort/filter still works with new stage column
- [ ] Test on different date/times to confirm Project ID timestamp accuracy

## Benefits

1. **Consistent UX**: Mirrors Lead Management action button pattern
2. **Workflow Tracking**: Clear visual indication of GC progress
3. **Project Association**: Auto-generated Project ID links GC to project system
4. **Unique Identification**: GC prefix + timestamp ensures uniqueness across categories
5. **Automatic**: No manual Project ID entry required
6. **Audit Trail**: timestamp in Project ID shows when GC was marked complete

## Future Enhancements

1. Add stage history tracking (log stage transitions with timestamps)
2. Add role-based restrictions (only certain roles can transition stages)
3. Add notifications when stage changes
4. Add bulk stage update capability
5. Add stage filter in the table (filter by Not Started, In Progress, Completed)

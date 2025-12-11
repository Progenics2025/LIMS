# Genetic Counselling Form - Visual Guide

## Form Structure

### Dialog Box
```
┌─────────────────────────────────────────────────┐
│ Add New GC / Edit Genetic Counselling          │
│ Create a new genetic counselling record.        │
├─────────────────────────────────────────────────┤
│                                                  │
│ [ID]    (hidden if new record)                 │
│                                                  │
│ IDENTIFICATION SECTION                         │
│ ┌──────────────────────────────────────────────┐
│ │ Unique ID *            [GC_001           ]   │
│ │ Project ID             [PG251202001      ]   │
│ └──────────────────────────────────────────────┘
│                                                  │
│ DATES & TIMES                                   │
│ ┌──────────────────────────────────────────────┐
│ │ Counselling Date       [YYYY-MM-DD  --:-- ]  │
│ │ GC Reg Start Time      [YYYY-MM-DD  --:-- ]  │
│ │ GC Reg End Time        [YYYY-MM-DD  --:-- ]  │
│ │ Counseling Start Time  [YYYY-MM-DD  --:-- ]  │
│ │ Counseling End Time    [YYYY-MM-DD  --:-- ]  │
│ └──────────────────────────────────────────────┘
│                                                  │
│ PATIENT INFORMATION                             │
│ ┌──────────────────────────────────────────────┐
│ │ Patient/Client Name    [John Doe         ]   │
│ │ Age                    [35               ]   │
│ │ Gender                 [Select ▼         ]   │
│ │ Email                  [john@email.com   ]   │
│ │ Phone                  [+1 234 567 8900  ]   │
│ │ Address                [123 Main St...   ]   │
│ └──────────────────────────────────────────────┘
│                                                  │
│ GC STAFF                                        │
│ ┌──────────────────────────────────────────────┐
│ │ GC Staff Name *        [Dr. Smith        ]   │
│ │ Other Members          [Dr. Jones        ]   │
│ │ Clinician/Researcher   [Dr. Brown        ]   │
│ │ Organisation/Hospital  [Medical Center   ]   │
│ │ Speciality             [Genetics         ]   │
│ └──────────────────────────────────────────────┘
│                                                  │
│ COUNSELLING DETAILS                             │
│ ┌──────────────────────────────────────────────┐
│ │ Service Name           [Genetic Service  ]   │
│ │ Counselling Type       [Pre-test ▼      ]   │
│ │ Query/Suspection       [Hereditary...    ]   │
│ │ Budget Opted           [50,000-100,000 ▼]   │
│ │ Budget Amount          [75,000           ]   │
│ │ Sample Type            [Blood ▼         ]   │
│ └──────────────────────────────────────────────┘
│                                                  │
│ STATUS & APPROVAL                               │
│ ┌──────────────────────────────────────────────┐
│ │ ☑ Approval from Head                         │
│ │ ☐ Potential Patient for Future Testing       │
│ │ ☑ Extended Family Testing Requirement        │
│ │ Payment Status         [Pending ▼      ]    │
│ │ Payment Mode           [Card ▼         ]    │
│ │ Testing Status         [In Progress ▼  ]    │
│ │ Action Required        [Yes ▼          ]    │
│ └──────────────────────────────────────────────┘
│                                                  │
│ LINKS & ATTACHMENTS                             │
│ ┌──────────────────────────────────────────────┐
│ │ GC Summary Sheet       [http://...       ]   │
│ │ Video Link             [http://...       ]   │
│ │ Audio Link             [http://...       ]   │
│ │ Sales Responsible      [John Smith       ]   │
│ └──────────────────────────────────────────────┘
│                                                  │
│ REMARKS                                         │
│ ┌──────────────────────────────────────────────┐
│ │ Remark/Comment                               │
│ │ [Patient has family history of...       ]   │
│ │ [genetic disorder. Further testing...   ]   │
│ │ [recommended.                           ]   │
│ └──────────────────────────────────────────────┘
│                                                  │
├─────────────────────────────────────────────────┤
│  [Cancel]                        [Add GC]       │
└─────────────────────────────────────────────────┘
```

## Form Field Details

### Required Fields (Must Fill)
1. **Unique ID** - Genetic counselling identifier (e.g., "GC_001")
   - Validation: Required, error message if empty
   - Used for: Unique record identification

### Highly Important Fields (Usually Required)
1. **GC Staff Name** - Primary counsellor name
   - Used for: Workflow routing and responsibilities

### Important Fields (Should Fill)
1. **Counselling Type** - Type of counselling session
   - Values: Pre-test, Post-test, etc.
   - Used for: Categorization and reporting

2. **Patient/Client Name** - Full name of patient/client
   - Used for: Identification and communication

### Boolean Checkboxes (Special Handling)
These three fields use controlled components for proper state management:

1. **Approval from Head**
   - Default: Unchecked (false)
   - Stored as: 0 (unchecked) or 1 (checked) in database
   - Type: Boolean checkbox

2. **Potential Patient for Future Testing**
   - Default: Unchecked (false)
   - Stored as: 0 or 1 in database
   - Type: Boolean checkbox

3. **Extended Family Testing Requirement**
   - Default: Unchecked (false)
   - Stored as: 0 or 1 in database
   - Type: Boolean checkbox

### Optional Fields
- Dates (counselling_date, registration times, etc.)
- Contact info (email, phone, address)
- Financial info (payment status, mode, budget)
- Organizational info (hospital, specialty)
- Links (video, audio, summary sheet)
- Any other fields not marked as required

## Form Behavior

### On Open (Add New)
1. Dialog opens with title "Add New GC"
2. All text fields appear empty
3. Boolean checkboxes are unchecked
4. Date fields appear empty
5. Select dropdowns show placeholder
6. `unique_id` field is in focus

### On Edit (Existing Record)
1. Dialog opens with title "Edit Genetic Counselling"
2. All fields populated with existing data
3. ID field hidden (stored internally)
4. Boolean checkboxes checked/unchecked based on data
5. Submit button says "Save Changes"

### On Submit
1. Form validates required fields
2. If valid: Sends to backend via POST/PUT
3. If invalid: Shows error toast for each field
4. Errors appear in browser console with `[GC Form]` prefix

### On Cancel
1. Dialog closes
2. Form resets to empty state
3. Changes discarded

## Field States

### Normal State
```
┌──────────────────────┐
│ Unique ID            │
│ [                 ]  │  (empty or filled)
└──────────────────────┘
```

### Error State
```
┌──────────────────────┐
│ Unique ID            │
│ [                 ]  │  (outline turns red)
│ ❌ Unique ID is required
└──────────────────────┘
```

### Checkbox - Unchecked
```
☐ Approval from Head
```

### Checkbox - Checked
```
☑ Approval from Head
```

## Data Flow

### CREATE (POST) Flow
```
User clicks "+ Add New GC"
         ↓
Form dialog opens (empty fields)
         ↓
User fills unique_id, gc_name, other fields
         ↓
User checks/unchecks checkboxes
         ↓
User clicks "Add GC"
         ↓
Form validates required fields
         ├→ Invalid: Toast error shown, form stays open
         └→ Valid: Continue...
         ↓
Form converts booleans: true→1, false→0
         ↓
Browser logs: [GC Form] Submitting form data: {...}
         ↓
POST request sent to /api/genetic-counselling-sheet
         ↓
Backend processes (boolean conversion, logging, saving)
         ↓
Response received (200 OK)
         ↓
Browser logs: [GC onSave] POST success, result: {id: 7, ...}
         ↓
Dialog closes
         ↓
New record appears in table
```

### UPDATE (PUT) Flow
```
User clicks edit icon on existing record
         ↓
Form dialog opens (fields pre-filled with data)
         ↓
User modifies one or more fields
         ↓
User clicks "Save Changes"
         ↓
Form validates required fields
         ├→ Invalid: Toast error shown, form stays open
         └→ Valid: Continue...
         ↓
Form converts booleans: true→1, false→0
         ↓
Browser logs: [GC Form] Submitting form data: {...}
         ↓
PUT request sent to /api/genetic-counselling-sheet/{id}
         ↓
Backend processes (boolean conversion, timestamp, saving)
         ↓
Response received (200 OK)
         ↓
Browser logs: [GC onSave] PUT success, modified_at: 2025-12-03T...
         ↓
Dialog closes
         ↓
Table updates with new values
```

### Error Flow
```
User clicks "Add GC" without filling unique_id
         ↓
Form validation fails
         ↓
Error callback triggered
         ↓
Browser logs: [GC Form] Validation errors: {unique_id: {...}}
         ↓
Toast appears: "Validation Error: unique_id: Unique ID is required"
         ↓
Form stays open (user can correct)
         ↓
User fills unique_id
         ↓
User clicks "Add GC" again
         ↓
Validation passes, submission proceeds
```

## Console Messages Reference

### Successful POST
```
[GC Form] Submitting form data: {
  unique_id: "GC_001",
  project_id: "PG251202001",
  patient_client_name: "John Doe",
  gc_name: "Dr. Smith",
  approval_from_head: true,
  potential_patient_for_testing_in_future: false,
  extended_family_testing_requirement: true,
  ...
}

[GC onSave] Starting save operation for record: new

[GC onSave] POST response status: 200

[GC onSave] POST success, result: {
  id: 7,
  unique_id: "GC_001",
  gc_name: "Dr. Smith",
  ...
}
```

### Validation Error
```
[GC Form] Validation errors: {
  unique_id: { message: "Unique ID is required" }
}

(Toast appears: "Validation Error: unique_id: Unique ID is required")
```

### Successful PUT
```
[GC Form] Submitting form data: {
  id: 5,
  patient_client_name: "Updated Name",
  ...
}

[GC onSave] Starting save operation for record: 5

[GC onSave] PUT response status: 200

[GC onSave] PUT success, modified_at: "2025-12-03T06:15:00.000Z"
```

## Tips for Using the Form

### ✅ DO
- Fill in `unique_id` first (it's required)
- Fill in `gc_name` for workflow
- Check checkboxes if approval needed
- Monitor browser console for logs
- Close and reopen form if needed

### ❌ DON'T
- Leave `unique_id` empty (will fail validation)
- Use special characters in IDs
- Refresh page immediately after submit (wait for close)
- Ignore error messages (they indicate what's wrong)

### 🔍 DEBUGGING
- Press F12 to open Developer Tools
- Go to Console tab
- Look for `[GC Form]` and `[GC onSave]` messages
- Check Network tab if request fails
- Look for red error messages

## Form Validation Rules

### `unique_id`
- **Required**: Yes
- **Type**: Text
- **Validation**: Must not be empty
- **Error**: "Unique ID is required"

### Other Fields
- **Required**: No (all optional except unique_id)
- **Type**: Varies (text, number, checkbox, select, date)
- **Validation**: Type checking only
- **Error**: None unless type mismatch

### Boolean Fields (Checkboxes)
- **Default**: Unchecked (false/0)
- **Stored as**: 0 or 1 in database
- **Frontend display**: Checkbox (checked or unchecked)
- **Validation**: None (any boolean state valid)

---

This visual guide should help you understand the form structure, data flow, and how to use it effectively!

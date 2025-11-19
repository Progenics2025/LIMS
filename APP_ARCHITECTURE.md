# LeadLab LIMS App Architecture & Data Flow

## System Overview

LeadLab LIMS is a full-stack React + Node.js application for managing clinical leads and samples in a laboratory information management system. It uses a three-tier architecture: **Database → Backend API → React Frontend**.

---

## 1. DATA MODEL & DATABASE LAYER

### Core Tables (in `shared/schema.ts`)

#### **leads** table
Main table storing lead/order information:
- **Identifiers**: `id` (UUID), `uniqueId`, `projectId`, `sampleId`
- **Organization Fields**: `organization`, `location`, `referredDoctor`, `email`, `phone`
- **Patient/Client Fields**: `patientClientName`, `patientClientEmail`, `patientClientPhone`, `patientAddress`, `age`, `gender`
- **Service Details**: `sampleType`, `serviceName`, `amountQuoted`, `tat` (turn-around time)
- **Lead Tracking**: `status` (quoted, cold, hot, won, converted, closed), `leadType`, `leadTypeDiscovery`
- **Dates**: `createdAt`, `convertedAt`, `dateSampleCollected`, `dateSampleReceived`
- **Tracking/Logistics**: `pickupFrom`, `pickupUpto`, `trackingId`, `courierCompany`, `shippingAmount`, `progenicsTRF`, `phlebotomistCharges`
- **Metadata**: `createdBy`, `geneticCounsellorRequired`, `budget`, `noOfSamples`, `salesResponsiblePerson`,`nutritionCounsellorRequired`

#### **samples** table
Stores individual samples linked to leads:
- `sampleId` (unique), `leadId` (foreign key), `status`
- Sample tracking: `sampleCollectedDate`, `sampleShippedDate`, `sampleDeliveryDate`
- Logistics: `trackingId`, `courierCompany`, `thirdPartyName`
- Finance: `amount`, `paidAmount`

#### **users** table
User accounts with roles (sales, operations, finance, lab, bioinformatics, reporting, manager, admin)

#### Other tables
- `labProcessing`, `reports`, `financeRecords`, `logisticsTracking`, `pricing`, `salesActivities`, `clients`, `recycleBin` (soft delete)

---

## 2. BACKEND API LAYER (server/routes.ts & server/storage.ts)

### Key API Endpoints

#### **Lead Management**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/leads` | GET | Fetch all leads |
| `/api/leads` | POST | Create a new lead |
| `/api/leads/:id` | PUT | Update an existing lead |
| `/api/leads/:id/status` | PUT | Change lead status (quoted → cold → hot → won) |
| `/api/leads/:id/convert` | POST | Convert lead to a sample |
| `/api/leads/:id` | DELETE | Soft-delete a lead (moves to recycle bin) |

#### **Sample Management**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/project-samples` | GET | Fetch all project samples (acts as lead list) |
| `/api/samples/:id` | PUT | Update sample tracking/status |
| `/api/samples/:id` | DELETE | Soft-delete a sample |

#### **File Upload**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/uploads/trf-db` | POST | Upload Progenics TRF (Test Report Form) file, store in DB |
| `/api/uploads/trf/:id` | GET | Download stored TRF file |

### Request/Response Flow

**POST /api/leads (Create Lead)**

```
1. Client sends form data (organization, location, doctor name, patient details, etc.)
   ↓
2. Express middleware normalizes date strings (YYYY-MM-DD, YYYY-MM-DDTHH:mm) to Date objects
   ↓
3. Zod schema validation via insertLeadSchema (all required fields checked)
   ↓
4. If valid → storage.createLead() inserts to DB, returns created lead object
   ↓
5. Notification service sends alert to relevant users
   ↓
6. Response: { id, organization, ..., status: "quoted" }
```

**PUT /api/leads/:id (Update Lead)**

```
1. Client sends partial lead data
   ↓
2. Date normalization (same as POST)
   ↓
3. Partial validation (only submitted fields checked)
   ↓
4. storage.updateLead() merges updates with existing record
   ↓
5. If status changed → send status-change notification
   ↓
6. Response: updated lead object
```

**GET /api/project-samples (Fetch Leads)**

```
1. Client makes request
   ↓
2. storage.getSamples() retrieves all samples + linked lead data via JOIN
   ↓
3. Returns array of normalized sample + lead records
   ↓
4. Response: [{ id, sampleId, leadId, organization, patientName, ... }, ...]
```

### Data Normalization (Backend)

The backend normalizes incoming date fields in **two stages**:

1. **Express Middleware** (server/index.ts)
   - Intercepts all `/api/leads` requests
   - Converts ISO strings or date strings to JavaScript Date objects
   - Handles multiple formats: `2025-11-18`, `2025-11-18T10:30`, `2025-11-18T10:30:00Z`

2. **In Route Handlers** (server/routes.ts)
   - Function: `normalizeDateFields()`
   - Re-validates and fixes any remaining date strings
   - Removes empty strings before validation
   - Ensures Zod date validators receive proper Date objects

---

## 3. FRONTEND DATA FLOW (React/TypeScript)

### Component Structure

**File**: `client/src/pages/LeadManagement.tsx` (~2400 lines)

**Core Responsibilities**:
1. Fetch leads from API (via React Query)
2. Display lead table with sorting/filtering
3. Create/Edit lead dialogs with form validation
4. Status transitions (quoted → cold → hot → won → converted)
5. Lead deletion (soft-delete)
6. TRF file upload

### Data Fetching Flow

```typescript
// Query hook that pulls from server
const { data: leads = [], isLoading } = useQuery<any[]>({
  queryKey: ['/api/project-samples'],
});

// Alternative fallback (not actively used but kept for compatibility)
const { data: projectSamples = [] } = useQuery<any[]>({
  queryKey: ['/api/project-samples']
});

// Use whichever source has data
const leadSource = projectSamples.length > 0 ? projectSamples : leads;
```

**Why two queries?** 
- Historical reason: codebase migrated from `/api/leads` to `/api/project-samples`
- Both queries point to the same endpoint for now
- Client picks whichever has data available

### Client-Side Data Normalization

**Function**: `normalizeLead(rawLeadObject)` → converts API response to UI schema

```typescript
// Converts DB snake_case to camelCase for React form fields
normalizeLead({
  organization: "Hospital ABC",
  referred_doctor: "Dr. Smith",      // DB column
  patient_client_name: "John Doe",   // DB column
  age: 45,
  created_at: "2025-11-18T...",      // DB column
  // ... more fields
})
↓
{
  organization: "Hospital ABC",
  referredDoctor: "Dr. Smith",       // Normalized to camelCase
  patientClientName: "John Doe",     // Normalized
  age: 45,
  createdAt: Date(2025-11-18T...),   // Converted to Date object
  // ... more fields
}
```

**Why normalize?** 
- Database uses snake_case (SQL convention)
- React forms expect camelCase (JavaScript convention)
- Single `normalizeLead()` function handles multiple input formats (direct DB, API response, nested objects)

### Form Data Processing

**Function**: `coerceNumericFields(formData)` → converts form inputs before submission

```typescript
Input (from form):
{
  amountQuoted: "50000",            // String from input
  budget: "100000",                 // String from input
  age: 35,                          // Number
  gender: "Male",                   // String
  dateSampleCollected: "2025-11-18T10:30",  // DateTime-local string
  pickupUpto: "2025-11-20"          // Date string
}
↓
Output (sent to API):
{
  amountQuoted: "50000.00",         // Decimal string for DB
  budget: "100000.00",              // Decimal string for DB
  age: 35,                          // Integer
  gender: "Male",
  dateSampleCollected: Date(...),   // Converted to Date object
  pickupUpto: Date(...),            // Converted to Date object
  createdBy: "user-uuid",           // Added from auth context
  uniqueId: "PG251118103045",       // Auto-generated: PG + timestamp
  projectId: "PG251118103045"       // Same as uniqueId
}
```

---

## 4. FILTERING & SORTING LOGIC

### Client-Side Filtering Pipeline

**Flow** (in `LeadManagement.tsx`):

```
Raw API Data (leads)
    ↓
[1] Normalize each lead via normalizeLead()
    ↓ normalizedLeads (camelCase, proper types)
[2] Filter by status (statusFilter dropdown)
    ↓
[3] Filter by search query (text search across fields)
    ↓ filteredLeads
[4] Sort by selected column (sortKey) & direction (sortDir)
    ↓ sortedLeads
[5] Apply pagination (page * pageSize)
    ↓ visibleLeads (displayed in table)
```

### Filter Implementation

```typescript
const filteredLeads = normalizedLeads.filter((l) => {
  // Status filter
  if (statusFilter && statusFilter !== 'all') {
    if (String(l.status) !== String(statusFilter)) return false;
  }
  
  // Text search (searches multiple fields)
  if (searchQuery) {
    const s = searchQuery.toLowerCase();
    const matches =
      String(l.organization || '').toLowerCase().includes(s) ||
      String(l.sampleId || '').toLowerCase().includes(s) ||
      String(l.referredDoctor || '').toLowerCase().includes(s) ||
      String(l.email || '').toLowerCase().includes(s) ||
      String(l.phone || '').toLowerCase().includes(s);
    return matches;
  }
  return true;
});
```

### Sorting Implementation

```typescript
const sortedLeads = (() => {
  if (!sortKey) return filteredLeads;  // No sort
  
  const copy = [...filteredLeads];
  copy.sort((a, b) => {
    const A = a[sortKey];
    const B = b[sortKey];
    
    // Handle nulls
    if (A == null && B == null) return 0;
    if (A == null) return sortDir === 'asc' ? -1 : 1;
    if (B == null) return sortDir === 'asc' ? 1 : -1;
    
    // Numeric comparison
    if (typeof A === 'number' && typeof B === 'number') {
      return sortDir === 'asc' ? A - B : B - A;
    }
    
    // String comparison
    const sA = String(A).toLowerCase();
    const sB = String(B).toLowerCase();
    if (sA < sB) return sortDir === 'asc' ? -1 : 1;
    if (sA > sB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
  return copy;
})();
```

### Pagination

```typescript
const pageSize = 25;  // User-selectable
const page = 1;       // Current page

const start = (page - 1) * pageSize;  // 0
const visibleLeads = sortedLeads.slice(start, start + pageSize);  // First 25 items

const totalPages = Math.ceil(filteredLeads.length / pageSize);
```

---

## 5. CREATE/EDIT LEAD FLOW

### Create Lead Dialog

**Steps**:

1. **User clicks "Create Lead" button**
   - Dialog opens with empty form

2. **User selects Lead Type** (Individual or Project/Bulk Testing)
   - Conditionally shows/hides fields via `selectedLeadType`
   - Project type: shows project contact fields
   - Individual type: shows patient contact fields

3. **User fills form fields**
   - Validation rules apply (required fields, email format, phone format)
   - `react-hook-form` manages form state
   - `zodResolver` validates on blur/submit

4. **User clicks "Create"**
   - Form validation runs
   - If errors: toast notification with error message
   - If valid: `coerceNumericFields()` converts form data
   - Generates `uniqueId` (PG/DG + timestamp) if not set
   - Calls `createLeadMutation.mutate()`

5. **Mutation sends to server**
   ```typescript
   const createLeadMutation = useMutation({
     mutationFn: async (data: LeadFormData) => {
       const leadData = { ...coerceNumericFields(data), createdBy: user?.id };
       const response = await apiRequest('POST', '/api/project-samples', leadData);
       return response.json();
     },
     onSuccess: async (createdLead) => {
       // Invalidate queries to refetch data
       queryClient.invalidateQueries({ queryKey: ['/api/project-samples'] });
       
       // Upload TRF file if selected
       if (selectedTrfFile && createdLead.id) {
         // POST to /api/uploads/trf-db
       }
       
       // Reset form & close dialog
       setIsCreateDialogOpen(false);
       form.reset();
       
       // Show success toast
       toast({ title: "Lead created", ... });
     }
   });
   ```

6. **Server processes create request**
   - Normalize dates
   - Validate with Zod schema
   - Insert into `leads` table
   - Create notification record
   - Return created lead object

7. **Client updates UI**
   - React Query refetches `/api/project-samples`
   - New lead appears in table
   - Dialog closes

### Edit Lead Dialog

**Similar to Create but**:
- Pre-populates form with existing lead data via `normalizeLead()`
- Calls `updateLeadMutation` instead of `createLeadMutation`
- Sends PUT request to `/api/leads/:id`

---

## 6. STATUS TRANSITIONS

**Valid flow**: quoted → cold → hot → won → converted → closed

**UI Implementation**:
- Each lead row has a "Mark [Next Status]" button
- Click → calls `updateLeadStatusMutation`
- Server updates `status` field and `convertedAt` timestamp (if reaching "won")
- Notification sent to relevant users
- UI updates immediately via React Query invalidation

**Example**:
```typescript
const handleStatusChange = (leadId: string, newStatus: string) => {
  updateLeadStatusMutation.mutate(
    { id: leadId, status: newStatus },
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/project-samples'] });
        toast({ title: `Status changed to ${newStatus}` });
      }
    }
  );
};
```

---

## 7. DATA VALIDATION PIPELINE

### Frontend Validation (Zod Schema)

```typescript
const leadFormSchema = insertLeadSchema.extend({
  organization: z.string().min(1, "Organization name is required").max(255, ...),
  location: z.string().min(1, "Location is required").max(255, ...),
  referredDoctor: z.string().min(1, "Clinical name/Referred doctor is required").max(255, ...),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().refine((phone) => isValidPhoneNumber(phone), 
    "Please enter a valid international phone number"),
  patientClientName: z.string().min(1, "Patient name is required"),
  patientClientPhone: z.string().refine((phone) => isValidPhoneNumber(phone), ...),
  sampleType: z.string().min(1, "Sample type is required"),
  amountQuoted: z.string().refine((val) => {
    const num = parseFloat(val);
    return !isNaN(num) && num > 0;
  }, "Amount must be a valid positive number"),
  // ... more fields
});
```

### Backend Validation (Zod + Storage)

```typescript
app.post("/api/leads", async (req, res) => {
  const normalized = normalizeDateFields(req.body);
  const result = insertLeadSchema.safeParse(normalized);
  
  if (!result.success) {
    return res.status(400).json({ 
      message: "Invalid lead data", 
      errors: result.error.errors,
      fields: formatZodErrors(result.error)
    });
  }
  
  const lead = await storage.createLead(result.data);
  res.json(lead);
});
```

---

## 8. SOFT DELETE & RECYCLE BIN

When a lead or sample is deleted:

1. **No direct DB deletion**
2. **Before deleting**: Insert record into `recycleBin` table:
   ```typescript
   await db.insert(recycleBin).values({
     id: randomUUID(),
     entityType: 'leads',      // or 'samples', 'users'
     entityId: id,             // original record ID
     data: recordSnapshot,     // full JSON of deleted record
     originalPath: '/leads/123'
   });
   ```
3. **Then delete** the original record
4. **User can restore** from Recycle bin page if needed

---

## 9. FILE UPLOADS (TRF Files)

### Upload Flow

```typescript
// User selects file in create/edit dialog
const [selectedTrfFile, setSelectedTrfFile] = useState<File | null>(null);

// On form submit, after lead is created:
if (selectedTrfFile && createdLead && createdLead.id) {
  const fd = new FormData();
  fd.append('trf', selectedTrfFile);
  fd.append('leadId', createdLead.id);
  
  const up = await fetch('/api/uploads/trf-db', { method: 'POST', body: fd });
  const body = await up.json();  // { id }
  
  // Update lead with TRF reference
  const trfUrl = `/api/uploads/trf/${body.id}`;
  await fetch(`/api/project-samples/${createdLead.id}`, {
    method: 'PUT',
    body: JSON.stringify({ progenicsTRF: trfUrl })
  });
}
```

### Server Processing

```typescript
app.post("/api/uploads/trf-db", uploadMemory.single('trf'), async (req, res) => {
  // File stored in req.file (multer)
  const leadId = req.body.leadId;
  
  // Store in leadTrfs table with file content
  const trfRecord = await storage.createLeadTrf({
    leadId,
    filename: req.file.originalname,
    data: req.file.buffer  // Raw binary data
  });
  
  res.json({ id: trfRecord.id });
});

// Download endpoint
app.get("/api/uploads/trf/:id", async (req, res) => {
  const trf = await storage.getLeadTrf(req.params.id);
  res.setHeader('Content-Disposition', `attachment; filename="${trf.filename}"`);
  res.send(trf.data);
});
```

---

## 10. REAL-TIME NOTIFICATIONS

### Trigger Points

**Leads**:
- Lead created
- Lead status changed (quoted → cold, etc.)
- Lead converted to sample

**Samples**:
- Sample status changed

### Notification Service

```typescript
// server/services/NotificationService.ts
class NotificationService {
  async notifyLeadCreated(leadId, organization, createdBy) {
    // Insert notification record
    // Send webhook/email to relevant users
  }
  
  async notifyLeadStatusChanged(leadId, organization, oldStatus, newStatus, changedBy) {
    // Insert notification record
    // Notify sales manager, finance, etc. based on status
  }
}
```

---

## 11. QUERY CLIENT & CACHING

### React Query Setup

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Fetching data
const { data: leads = [], isLoading } = useQuery({
  queryKey: ['/api/project-samples'],  // Cache key
  // Automatically refetches on window focus, interval (if set), etc.
});

// Mutating data
const createLeadMutation = useMutation({
  mutationFn: async (data) => apiRequest('POST', '/api/project-samples', data),
  onSuccess: () => {
    // Invalidate cache to force refetch
    queryClient.invalidateQueries({ queryKey: ['/api/project-samples'] });
  }
});

// Manual refetch
const handleRefresh = () => {
  queryClient.refetchQueries({ queryKey: ['/api/project-samples'] });
};
```

---

## 12. EXAMPLE END-TO-END FLOW

### Creating a Project/Bulk Testing Lead

1. **User opens LeadManagement page**
   - React Query fetches `/api/project-samples`
   - Backend returns all samples + linked leads (JOIN)
   - Frontend normalizes each record via `normalizeLead()`
   - Data rendered in table with 34 columns

2. **User clicks "Create Lead" button**
   - Modal dialog opens with empty form
   - All optional fields hidden

3. **User selects "Project/Bulk Testing" as Lead Type**
   - Form conditionally shows: project contact fields, project name
   - Form hides: patient personal details (only name, phone, email for patient)
   - Sample type dropdown populated

4. **User fills form**:
   - Organization: "XYZ Hospital"
   - Referred Doctor: "Dr. Smith"
   - Email: "dr.smith@hospital.com"
   - Phone: "+91-9876543210"
   - Sample Type: "Blood"
   - Amount: "50000"
   - Patient Name: "John Doe"
   - Patient Phone: "+91-9876543211"
   - Age: 45
   - Gender: Male

5. **User clicks "Create"**
   - `coerceNumericFields()` converts:
     - `amountQuoted: "50000"` → `"50000.00"` (decimal string)
     - `age: 45` → stays as number
     - `dateSampleCollected: "2025-11-18T10:30"` → `Date(...)`
   - Generates `uniqueId: "PG251118103045"` (auto)
   - Adds `createdBy: "user-123"` from auth context
   - Sends POST to `/api/project-samples`

6. **Server processes request**
   - Middleware normalizes date strings to Date objects
   - Zod schema validates all required fields
   - `storage.createLead()` inserts into `leads` table with ID
   - `notificationService.notifyLeadCreated()` sends alert
   - Returns: `{ id: "uuid-...", uniqueId: "PG251118...", organization: "XYZ Hospital", ... }`

7. **Client updates UI**
   - `queryClient.invalidateQueries(['/api/project-samples'])`
   - React Query refetches `/api/project-samples`
   - New lead appears in table
   - Dialog closes
   - Toast: "Lead created successfully"

8. **User can now**:
   - Search for the lead (by name, org, email)
   - Filter by status
   - Sort by any column
   - Edit the lead
   - Change status (quoted → cold → hot → won)
   - Convert to sample

---

## TECH STACK SUMMARY

| Layer | Technology |
|-------|-----------|
| **Database** | MySQL with Drizzle ORM |
| **Backend** | Express.js (Node.js) + TypeScript |
| **API** | RESTful JSON APIs with Zod validation |
| **Frontend** | React 18 + TypeScript + Vite |
| **Form Management** | react-hook-form + Zod |
| **Data Fetching** | @tanstack/react-query (TanStack Query) |
| **UI Components** | Radix UI (custom component library) |
| **Styling** | Tailwind CSS + postcss |
| **Charts** | Recharts (pie charts for dashboard) |
| **File Upload** | Multer (disk & memory storage) |
| **Phone Input** | react-phone-number-input |
| **Notifications** | Custom NotificationService (webhooks/events) |

---

## KEY TAKEAWAYS

✅ **Data flows**: DB (MySQL) → Backend API (Express) → Frontend (React)
✅ **Normalization**: Client & Server both normalize data (dates, field names) to handle schema mismatches
✅ **Filtering**: Applied on client-side after fetching all leads (status, search, sort, paginate)
✅ **Validation**: Zod schemas ensure data integrity at form submission (frontend) and API (backend)
✅ **Caching**: React Query manages cache; invalidated on mutations to keep UI in sync
✅ **Soft Deletes**: Records moved to `recycleBin` before deletion
✅ **Notifications**: Triggered on lead/sample creation and status changes
✅ **File Uploads**: TRF files stored in database via Multer + custom DB table

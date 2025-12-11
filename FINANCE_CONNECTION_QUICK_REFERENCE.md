# Finance Management Connection - Quick Reference

## ✅ Database Connection Status: VERIFIED

---

## Connection Chain (Quick Overview)

```
┌─────────────────────────────────────────────┐
│   Frontend: FinanceManagement.tsx           │
│   (React Component + React Query)           │
└──────────────┬──────────────────────────────┘
               │
               ↓ API Calls
┌─────────────────────────────────────────────┐
│   Backend: API Endpoints (routes.ts)        │
│   GET/POST/PUT/DELETE /api/finance          │
└──────────────┬──────────────────────────────┘
               │
               ↓ Storage Logic
┌─────────────────────────────────────────────┐
│   Storage Layer (storage.ts)                │
│   • getFinanceRecords()                     │
│   • createFinanceRecord()                   │
│   • updateFinanceRecord()                   │
│   • deleteFinanceRecord()                   │
└──────────────┬──────────────────────────────┘
               │
               ↓ ORM Query
┌─────────────────────────────────────────────┐
│   Drizzle ORM (shared/schema.ts)            │
│   financeRecords → "finance_sheet"          │
└──────────────┬──────────────────────────────┘
               │
               ↓ Database Connection
┌─────────────────────────────────────────────┐
│   MySQL Connection Pool (server/db.ts)      │
│   Host: 192.168.29.11:3306                  │
│   DB: lead_lims2                            │
│   User: remote_user                         │
└──────────────┬──────────────────────────────┘
               │
               ↓ Table Access
┌─────────────────────────────────────────────┐
│   MySQL Table: finance_sheet                │
│   • 40+ columns (finance data)              │
│   • Timestamp tracking                      │
│   • User audit trail                        │
│   • Status flags                            │
└─────────────────────────────────────────────┘
```

---

## API Endpoint Reference

| Method | Endpoint | Function | Handler |
|---|---|---|---|
| **GET** | `/api/finance` | Fetch records with pagination | Line 1809 |
| **POST** | `/api/finance` | Create new record | Line 1820 |
| **PUT** | `/api/finance/:id` | Update record | Line 1833 |
| **DELETE** | `/api/finance/:id` | Delete record | Line 1848 |

---

## Frontend Data Flow

```
User Input (Form)
    ↓
React Hook Form (editForm)
    ↓
Zod Schema Validation
    ↓
Update Mutation
    ↓
apiRequest('PUT', `/api/finance/${id}`, updates)
    ↓
Server Receives & Validates
    ↓
Storage Layer Updates DB
    ↓
React Query Invalidates Cache
    ↓
UI Refreshes with New Data
```

---

## Database Schema Summary

| Column Name | Type | Notes |
|---|---|---|
| `id` | BIGINT | Primary Key, Auto-increment |
| `unique_id` | VARCHAR(255) | Not Null |
| `project_id` | VARCHAR(255) | Finance project reference |
| `sample_collection_date` | TIMESTAMP | Date field |
| `invoice_number` | VARCHAR(255) | Billing reference |
| `invoice_amount` | DECIMAL(10,2) | Currency field |
| `payment_receipt_amount` | DECIMAL(10,2) | Currency field |
| `balance_amount` | DECIMAL(10,2) | Calculated field |
| `mode_of_payment` | VARCHAR(100) | Payment method |
| `created_at` | TIMESTAMP | Auto-generated |
| `created_by` | VARCHAR(255) | User tracking |
| `modified_at` | TIMESTAMP | Update tracking |
| `modified_by` | VARCHAR(255) | Update tracking |
| `remark_comment` | TEXT | Notes field |
| + 25 more fields | Various | Organization, clinician, patient, alert, status |

---

## File Cross-Reference

| Purpose | File | Key Lines |
|---|---|---|
| ORM Schema | `/shared/schema.ts` | 288-337 |
| Database Connection | `/server/db.ts` | 1-30 |
| API Routes | `/server/routes.ts` | 1809-1864 |
| Storage Layer | `/server/storage.ts` | 931-1170 |
| Frontend Component | `/client/src/pages/FinanceManagement.tsx` | 1-990 |

---

## Query Examples

### Fetch Records
```typescript
const res = await fetch('/api/finance?page=1&pageSize=25');
const data = await res.json();
// Returns: { rows: [...], total: number }
```

### Create Record
```typescript
const res = await fetch('/api/finance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uniqueId: 'ABC123',
    projectId: '456',
    invoiceNumber: 'INV-001',
    invoiceAmount: '5000',
    // ... more fields
  })
});
```

### Update Record
```typescript
const res = await fetch('/api/finance/123', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoiceAmount: '5500',
    paymentReceiptAmount: '5500',
    // ... fields to update
  })
});
```

### Delete Record
```typescript
const res = await fetch('/api/finance/123', {
  method: 'DELETE'
});
```

---

## Type Safety

✅ **Full TypeScript Support:**
- Frontend form fields type-checked
- Database columns type-safe via Drizzle
- API request/response types defined
- Runtime validation with Zod

**Type Exports from Schema:**
```typescript
type FinanceRecord = typeof financeRecords.$inferSelect;
type InsertFinanceRecord = z.infer<typeof insertFinanceRecordSchema>;
```

---

## Validation Layers

1. **Client-Side** (React Hook Form + Zod)
   - Optional field validation
   - Type checking
   - Format validation

2. **Server-Side** (routes.ts)
   - Schema.safeParse() validation
   - Error message generation
   - 400 status for invalid data

3. **Database** (MySQL)
   - Column type constraints
   - NOT NULL constraints
   - UNIQUE constraints

---

## Status: ✅ FULLY CONNECTED & OPERATIONAL

All components properly connected:
- ✅ Frontend calls correct endpoints
- ✅ Endpoints route to storage layer
- ✅ Storage layer queries database
- ✅ Database table exists with proper schema
- ✅ ORM mapping is correct
- ✅ Type safety enforced
- ✅ Error handling in place
- ✅ Data flows bidirectionally

**No connection issues detected.**

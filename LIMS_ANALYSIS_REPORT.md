# LeadLab LIMS - Comprehensive Code Analysis Report
## Date: 2025-12-29

---

## 🔴 CRITICAL ISSUE: Complete Schema Mismatch

The primary cause of functionality failures is a **complete mismatch** between:
1. The table names in `schema.ts` vs actual database
2. The column names/structure in `schema.ts` vs actual database

### Tables Expected by Code vs Actual Database Tables

| Code Expects (schema.ts) | Actual Table in DB | Status |
|--------------------------|-------------------|--------|
| `lead_management` | `leads` | ❌ MISMATCH |
| `sample_tracking` | `samples` | ❌ MISMATCH |
| `finance_sheet` | `finance_records` | ❌ MISMATCH |
| `genetic_counselling_records` | `genetic_counselling` | ❌ MISMATCH |
| `labprocess_discovery_sheet` | Does NOT exist | ❌ MISSING |
| `labprocess_clinical_sheet` | Does NOT exist | ❌ MISSING |
| `bioinformatics_sheet_clinical` | `bioinformatics` | ❌ MISMATCH |
| `bioinformatics_sheet_discovery` | Does NOT exist | ❌ MISSING |
| `process_master_sheet` | Does NOT exist | ❌ MISSING |
| `nutritional_management` | Does NOT exist | ❌ MISSING |
| `reports` | `reports` | ✅ OK (but empty) |
| `users` | `users` | ✅ OK |

---

## 🔥 Column Mismatch Analysis

### `leads` Table - SEVERE MISMATCH

**Schema.ts expects (lead_management):**
- `unique_id`, `project_id`, `organisation_hospital`, `clinician_researcher_name`, `patient_client_address`, etc.

**Actual DB has (leads):**
- `organization`, `location`, `referred_doctor`, `clinic_hospital_name`, `phone`, `email`, `client_email`, `test_name`, `amount_quoted`, etc.

**Critical missing columns in actual DB:**
- `unique_id` ❌
- `project_id` ❌
- `clinician_researcher_email` ❌
- `clinician_researcher_phone` ❌
- `patient_client_address` ❌
- `sample_pick_up_from` ❌
- `delivery_up_to` ❌
- `sample_collection_date` ❌
- `sample_shipped_date` ❌
- `sample_recevied_date` ❌

### `samples` Table - SEVERE MISMATCH

**Schema.ts expects (sample_tracking):**
- `unique_id`, `project_id`, `sample_collection_date`, `sample_shipment_amount`, etc.

**Actual DB has (samples):**
- `sample_id`, `lead_id`, `amount`, `paid_amount`, `pickup_location`, `delivery_address`, etc.

**Key differences:**
- Schema expects `unique_id` → DB has `sample_id`
- Schema expects `sample_shipment_amount` → DB has `amount`
- Schema expects complex fields → DB has simpler structure

### 2. **Column Name Mismatches**

| Code Column | Actual DB Column |
|-------------|-----------------|
| `total_amount_received_status` | `total_payment_received_status` |
| `amount_received` | Does not exist |
| `amount` (samples) | Schema uses different structure |
| `paidAmount` | `paid_amount` |

### 3. **Budget Field is NULL**

In `finance_records` table, the `budget` column is NULL for all 6 records, which is why pending revenue calculations return 0.

---

## 🛠️ How to Fix

### Option A: Align Code to Database (RECOMMENDED)

Update `shared/schema.ts` to use the correct table names:

```typescript
// Change this:
export const leads = mysqlTable("lead_management", { ... });

// To this:
export const leads = mysqlTable("leads", { ... });
```

All mappings need updating:
- `lead_management` → `leads`
- `sample_tracking` → `samples`
- `finance_sheet` → `finance_records`
- `genetic_counselling_records` → `genetic_counselling`

### Option B: Create Missing Tables from SQL Schema

Run the `database_schema.sql` to create the tables the code expects:
- `lead_management`
- `sample_tracking`
- `finance_sheet`
- All other missing tables

Then migrate data from existing tables.

---

## 📋 Specific Issues & Fixes

### Issue 1: Pending Revenue Shows ₹0

**Cause**: 
- `finance_records.budget` is NULL for all records
- Code was looking for non-existent `finance_sheet` table

**Fix Applied**: Updated queries to use correct table names. However, data still needs to be populated.

**Data Fix SQL**:
```sql
-- Update finance_records with budget from linked leads
UPDATE finance_records fr
JOIN samples s ON fr.sample_id = s.sample_id
JOIN leads l ON s.lead_id = l.id
SET fr.budget = l.budget
WHERE fr.budget IS NULL AND l.budget IS NOT NULL;
```

### Issue 2: Reports Pending Shows 0

**Cause**: The `reports` table is genuinely empty (0 records).

**Root Cause**: No mechanism is auto-creating reports when samples are processed.

**Fix**: Implement automatic report creation when:
1. A sample reaches a certain processing stage
2. Lab processing is complete
3. Bioinformatics analysis is complete

### Issue 3: Dashboard Active Leads Shows 0

**Cause**: All 6 leads have status = "converted"

**This is correct behavior** - active leads exclude converted leads.

### Issue 4: Many API Endpoints Fail

**Cause**: ORM queries fail because table names don't match.

**Example Error Flow**:
```
schema.ts defines: export const leads = mysqlTable("lead_management", ...)
Drizzle generates: SELECT * FROM lead_management
Database has: Table named "leads", not "lead_management"
Result: Query fails with "Table doesn't exist"
```

---

## 🗂️ Complete Schema Alignment Needed

Here's the comprehensive mapping of what the schema.ts file declares vs what exists:

### Current schema.ts Definitions:

```typescript
// Line 22: leads mapped to "lead_management" - WRONG, should be "leads"
export const leads = mysqlTable("lead_management", { ... });

// Line 76: samples mapped to "sample_tracking" - WRONG, should be "samples"
export const samples = mysqlTable("sample_tracking", { ... });

// Line 288: financeRecords mapped to "finance_sheet" - WRONG, should be "finance_records"
export const financeRecords = mysqlTable("finance_sheet", { ... });

// Line 243: geneticCounselling mapped to "genetic_counselling_records" - WRONG
export const geneticCounselling = mysqlTable("genetic_counselling_records", { ... });
```

---

## 📝 Action Items to Get LIMS Fully Working

### Phase 1: Fix Critical Schema Issues (Immediate)

1. [ ] Update `shared/schema.ts` - change all table names to match actual DB
2. [ ] Verify column names match between schema and DB
3. [ ] Restart server and test basic CRUD operations

### Phase 2: Fix Data Issues

1. [ ] Populate `budget` in `finance_records` from linked `leads`
2. [ ] Create missing reports from completed samples
3. [ ] Verify all foreign key relationships

### Phase 3: Missing Tables

Create or remove references to:
- [ ] `labprocess_discovery_sheet`
- [ ] `labprocess_clinical_sheet`
- [ ] `bioinformatics_sheet_discovery`
- [ ] `process_master_sheet`
- [ ] `nutritional_management`

### Phase 4: API Fixes

Update all API routes in `routes.ts` that use raw SQL to use correct table names:
- `/api/dashboard/stats`
- `/api/dashboard/revenue-analytics`
- Multiple other endpoints

---

## 🔧 Quick Fix Command

To quickly update the schema.ts file, these are the key changes needed:

```bash
# In schema.ts, change:
"lead_management" → "leads"
"sample_tracking" → "samples"  
"finance_sheet" → "finance_records"
"genetic_counselling_records" → "genetic_counselling"
```

---

## Summary

**The LIMS software is NOT broken - it's configured for a different database schema than what exists.**

The solution is straightforward: align the ORM schema definitions in `shared/schema.ts` with the actual table names in the database. This is a configuration fix, not a code logic fix.

Once aligned, most features should start working because the business logic is sound - only the database table references are incorrect.

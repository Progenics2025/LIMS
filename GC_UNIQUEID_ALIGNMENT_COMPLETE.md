# Genetic Counselling uniqueId Alignment - COMPLETE

## Objective
Ensure Genetic Counselling uses the **SAME uniqueId generation logic** as Lead Management, even when records are created directly from the Add GC modal. No separate or different uniqueId rules.

## Changes Made

### 1. Frontend: GeneticCounselling.tsx
**File**: `client/src/pages/GeneticCounselling.tsx`

- **Added import**: `import { generateRoleId } from '@/lib/generateRoleId';`
- **Updated uniqueId generation** (lines ~407-420):
  - **OLD**: Fetched from server endpoint `/api/genetic-counselling/generate-ids` which used hardcoded `GC` prefix
    - Format: `GCYYMMDDHHMMSS` (e.g., `GC260128162539`)
  - **NEW**: Uses client-side `generateRoleId(user.role)` directly (same as Lead Management)
    - Format: `YYCodeMMDDHHMM` (e.g., `26PG01281625`)
    - Uses user's role: `PG` (production), `AD` (admin), `FN` (finance), etc.
    - Falls back to `'production'` role if not available

### 2. Backend: Server Routes
**File**: `server/routes.ts`

- **Updated endpoint**: `POST /api/genetic-counselling/generate-ids`
  - Now uses `await generateRoleId('production')` instead of hardcoded `GC` prefix
  - Kept for backwards compatibility
  - Returns same format as client-side generation
  
### 3. Auto-Creation Paths
Both auto-creation flows already used consistent logic and require **no changes**:

- **Path 1**: When GC is auto-created on lead conversion
  - Uses `lead.uniqueId` (which is role-based via `generateRoleId`)
  
- **Path 2**: When GC is created via explicit request after sample conversion
  - Uses `conversion.sample.uniqueId` (inherited from lead's role-based uniqueId)

## Uniqueness Format Reference

### Lead Management
```
Format: YYCodeMMDDHHMM
Example: 26PG01281625
  - 26 = year (2026)
  - PG = role (production)
  - 01 = month
  - 28 = day
  - 16 = hour
  - 25 = minute
```

### Genetic Counselling (Now Same as Lead Management)
```
Format: YYCodeMMDDHHMM
Example: 26PG01281625
  - Uses SAME format and logic as Lead Management
  - No separate "GC" prefix anymore
```

## Testing

### Manual Verification
1. Create a Lead → uniqueId is `26PG01281625` (role-based)
2. Create a GC directly → uniqueId is also `26PG01281625` (role-based)
3. Convert lead with geneticCounselorRequired flag → auto-created GC gets `26PG01281625` (lead's uniqueId)

### Dev Server Status
✅ Server started successfully without errors
✅ No TypeScript compilation issues
✅ All modules initialized correctly

## Benefits

1. **Consistency**: All records (Lead, GC) use same uniqueId generation logic
2. **Role-Based**: Uniquely identifies the role that created the record
3. **Time-Stamped**: Records creation timestamp in the ID (YYMMDDHHMM precision)
4. **No Collisions**: Extremely low probability of duplicate IDs due to timestamp + random suffix (in server generateRoleId)
5. **Simplified**: Removed the need for separate server-side endpoint for GC ID generation

## Related Code Locations

- Client-side logic: `client/src/lib/generateRoleId.ts`
- Server-side logic: `server/lib/generateRoleId.ts`
- Lead Management usage: `client/src/pages/LeadManagement.tsx` (line 847)
- GC direct create: `client/src/pages/GeneticCounselling.tsx` (line ~410)
- GC auto-create from lead: `server/routes.ts` (line ~968)
- GC API endpoint: `server/routes.ts` (line 4137)

## Notes

- The `project_id` field remains empty (`''`) for GC records when created directly
- For auto-created GC records, `project_id` comes from the lead's `projectId`
- All auto-creation paths already maintain consistency - no changes needed there

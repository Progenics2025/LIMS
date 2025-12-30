# Data Update & Caching Fixes Summary

## Overview
Addressed the issue where data updates were not immediately reflected in the UI tables across the application. This was caused by aggressive caching (`staleTime: Infinity`) and mutations not forcing a refetch of stale data.

## Changes Made

### 1. Global Caching Configuration
- **File:** `client/src/lib/queryClient.ts`
- **Change:** Updated `staleTime` from `Infinity` to `30000` (30 seconds).
- **Change:** Enabled `refetchOnWindowFocus: true`.

### 2. Mutation Updates (Immediate Refetching)
Updated `onSuccess` callbacks in the following files to include `await queryClient.invalidateQueries({ ..., refetchType: 'all' })`. This forces React Query to immediately refetch data from the server, ignoring the stale time.

- **Lead Management:** `client/src/pages/LeadManagement.tsx`
- **Sample Tracking:** `client/src/pages/SampleTracking.tsx`
- **Lab Processing:** `client/src/pages/LabProcessing.tsx`
- **Finance Management:** `client/src/pages/FinanceManagement.tsx`
- **Bioinformatics:** `client/src/pages/Bioinformatics.tsx`
- **Nutrition:** `client/src/pages/Nutrition.tsx`
- **Report Management:** `client/src/pages/ReportManagement.tsx`
- **Process Master:** `client/src/pages/ProcessMaster.tsx`
- **Recycle Bin:** `client/src/pages/RecycleBin.tsx`
- **Admin Panel:** `client/src/pages/AdminPanel.tsx`

### 3. Removed Local Overrides
Removed local `staleTime` overrides in `FinanceManagement.tsx` and `GeneticCounselling.tsx` to ensure consistent global caching behavior.

### 4. Bug Fixes
- **Lab Processing:** Fixed syntax errors in `alertBioinformaticsMutation`.
- **Finance:** Corrected `getFinanceStats` backend logic to use the correct table.

## Verification
- **Action:** Edit or save a record in any module.
- **Expected Result:** The table should immediately update to reflect the changes without requiring a manual page refresh.

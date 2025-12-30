# Finance Table Alignment Fix

## Issue
The "Finance Records" table in `FinanceManagement.tsx` was displaying misaligned columns. Specifically, the content was shifted left because of missing and misplaced cells in the table body compared to the table header.

## Root Cause
1.  **Missing Cell:** The `Transactional Number` cell was missing in the table body.
2.  **Misplaced Cell:** The `UTR Details` cell was placed where `Transactional Number` should have been, causing a shift in subsequent columns.

## Fix
Updated `client/src/pages/FinanceManagement.tsx` to:
1.  Add a `TableCell` for `transactionalNumber` after `modeOfPayment`.
2.  Move the `utrDetails` `TableCell` to its correct position after `totalAmountReceivedStatus`.

## Verification
- **Header Sequence:**
    - Mode of Payment
    - Transactional Number
    - Balance Amount Received Date
    - Total Amount Received Status
    - UTR Details
    - Third Party Charges

- **Body Sequence (Fixed):**
    - `record.modeOfPayment`
    - `record.transactionalNumber`
    - `record.balanceAmountReceivedDate`
    - `record.totalAmountReceivedStatus`
    - `record.utrDetails`
    - `record.thirdPartyCharges`

The table columns should now align perfectly.

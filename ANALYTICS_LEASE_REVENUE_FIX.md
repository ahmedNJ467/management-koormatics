# Analytics Lease Revenue Fix

## Problem

The analytics dashboard was showing lease revenue for all active leases regardless of whether invoices had been paid. This created inaccurate financial reporting where revenue was counted before payment was actually received.

## Solution

Updated the financial calculation system to only include lease revenue from **paid invoices** instead of raw lease data.

## Changes Made

### 1. Updated Financial Calculation Functions

#### `src/lib/financial-calculations.ts`

- **Modified `calculateFinancialData()`**: Added `leaseInvoicesData` parameter
- **Updated lease revenue calculation**: Now filters for `status === "paid"` or `invoice_status === "paid"`
- **Modified `calculateMonthlyFinancialData()`**: Uses paid lease invoices instead of raw lease data
- **Updated monthly revenue calculation**: Only includes revenue from paid invoices for each billing period

#### `src/lib/financial-analytics.ts`

- **Modified `calculateCombinedFinancialData()`**: Added `leaseInvoicesData` parameter
- **Updated function calls**: Passes lease invoices data to financial calculations

### 2. Updated Data Hooks

#### `src/hooks/use-combined-financial-data.ts`

- **Added lease invoices data**: Imports and uses `useLeaseInvoices` hook
- **Added year filtering**: Filters lease invoices by selected year
- **Updated function calls**: Passes filtered lease invoices to financial calculations

### 3. Updated Components

#### `src/pages/CostAnalytics.tsx`

- **Added lease invoices data**: Uses `useLeaseInvoices` hook
- **Updated financial calculations**: Passes lease invoices data to `calculateFinancialData`
- **Updated comparison calculations**: Handles lease invoices in comparison data

#### `src/components/reports/ReportsSummaryCards.tsx`

- **Updated function signature**: Added empty arrays for lease data parameters

## Key Changes in Logic

### Before (Incorrect)

```typescript
// Calculate revenue from vehicle leases (active leases only)
const leaseRevenue = safeVehicleLeasesData
  .filter((lease) => lease.lease_status === "active")
  .reduce((sum, lease) => {
    const dailyRate = Number(lease.daily_rate || 0);
    const monthlyRate = Number(lease.monthly_rate || 0);
    return sum + (monthlyRate || dailyRate * 30);
  }, 0);
```

### After (Correct)

```typescript
// Calculate revenue from vehicle leases (only from paid invoices)
const leaseRevenue = safeLeaseInvoicesData
  .filter(
    (invoice) => invoice.status === "paid" || invoice.invoice_status === "paid"
  )
  .reduce((sum, invoice) => sum + Number(invoice.amount || 0), 0);
```

## Impact

### ✅ **Fixed Issues**

1. **Accurate Revenue Reporting**: Analytics now only show revenue from actually paid invoices
2. **Proper Cash Flow Tracking**: Revenue is recognized when payment is received, not when invoices are generated
3. **Consistent Financial Data**: All financial calculations now use the same paid invoice logic

### 📊 **Analytics Dashboard Changes**

- **Total Revenue**: Now only includes paid lease invoices
- **Monthly Revenue**: Shows actual received payments per month
- **Profit Calculations**: Based on actual received revenue
- **Revenue vs Expenses Chart**: Reflects real cash flow

### 🔄 **Data Flow**

1. **Lease Created** → No revenue impact
2. **Invoice Generated** → No revenue impact
3. **Invoice Paid** → Revenue appears in analytics
4. **Analytics Updated** → Real-time reflection of paid invoices

## Testing

To verify the fix:

1. Create a vehicle lease
2. Generate monthly invoices (should not affect analytics)
3. Mark invoices as "paid" (should now appear in analytics)
4. Check analytics dashboard for accurate revenue reporting

## Future Considerations

- **Invoice Status Tracking**: Ensure proper status updates when payments are received
- **Payment Integration**: Consider integrating with payment processing systems
- **Audit Trail**: Maintain records of when invoices transition from generated to paid
- **Reporting Periods**: Consider adding filters for different invoice statuses in analytics

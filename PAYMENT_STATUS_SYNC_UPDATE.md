# Payment Status Sync Update

## Overview

Updated the lease payment status system to automatically reflect invoice payment status and sync in real-time when invoices are updated.

## Changes Made

### 1. Database Schema Updates

#### New Payment Status Enum

**File**: `supabase/migrations/20250115_update_payment_status_enum.sql`

**Old Statuses**:

- `current` - Payments up to date
- `overdue` - Payments past due
- `partial` - Partial payments received
- `paid_ahead` - Advance payments made

**New Statuses** (matching invoice statuses):

- `draft` - Invoice created but not sent
- `sent` - Invoice sent to lessee
- `paid` - Invoice fully paid
- `overdue` - Invoice past due date
- `cancelled` - Invoice cancelled

#### Database Functions

- **`update_lease_payment_status_from_invoice()`**: Automatically updates lease payment status when invoice status changes
- **`calculate_lease_payment_status()`**: Calculates overall lease payment status based on all associated invoices
- **`update_all_lease_payment_statuses()`**: Updates payment status for all leases based on their invoice statuses

#### Database Triggers

- **`trigger_update_lease_payment_status_from_invoice`**: Automatically triggers when invoice status changes

### 2. Frontend Updates

#### UI Components Updated

**Files Updated**:

- `src/components/leasing/LeaseDetailsDialog.tsx`
- `src/pages/VehicleLeasing.tsx`
- `src/components/leasing/LeaseForm.tsx`

**Changes**:

- Updated payment status badge configurations
- Updated dropdown options in forms and filters
- Updated default values from "current" to "draft"
- Updated form schemas and TypeScript types

#### New Utility Functions

**File**: `src/lib/lease-payment-status-sync.ts`

**Functions**:

- `updateLeasePaymentStatus()`: Updates payment status for a specific lease
- `updateAllLeasePaymentStatuses()`: Updates all lease payment statuses
- `useLeasePaymentStatusSync()`: React hook for syncing payment status

#### Invoice Integration

**File**: `src/components/invoices/hooks/useInvoiceMutations.ts`

**Changes**:

- Added automatic lease payment status sync when invoices are created/updated
- Added sync when payments are recorded
- Invalidates lease queries to refresh UI

### 3. Automatic Sync Logic

#### Status Calculation Rules

1. **Overdue**: Any invoice is overdue → Lease status = "overdue"
2. **Cancelled**: All invoices cancelled → Lease status = "cancelled"
3. **Paid**: All invoices paid → Lease status = "paid"
4. **Sent**: Some invoices sent/draft → Lease status = "sent"
5. **Draft**: No invoices or all draft → Lease status = "draft"

#### Sync Triggers

- **Invoice Created**: Updates lease status based on new invoice
- **Invoice Status Changed**: Automatically recalculates lease status
- **Payment Recorded**: Updates lease status when invoice becomes paid
- **Invoice Deleted**: Recalculates lease status without deleted invoice

### 4. User Experience Improvements

#### Real-time Updates

- Lease payment status automatically updates when invoice status changes
- No manual intervention required
- Consistent status across all interfaces

#### Visual Indicators

- **Draft**: Gray badge - Invoice created but not sent
- **Sent**: Blue badge - Invoice sent to lessee
- **Paid**: Green badge - Invoice fully paid
- **Overdue**: Red badge - Invoice past due date
- **Cancelled**: Gray badge - Invoice cancelled

#### Filtering Options

- Updated payment status filters in Vehicle Leasing page
- All new statuses available for filtering
- Consistent with invoice status filtering

## Benefits

### ✅ **Automatic Synchronization**

- Lease payment status automatically reflects invoice payment status
- No manual updates required
- Real-time status updates

### ✅ **Consistent Data**

- Single source of truth (invoice status)
- Eliminates discrepancies between lease and invoice status
- Accurate financial reporting

### ✅ **Improved User Experience**

- Clear status indicators
- Automatic updates
- Consistent interface across all components

### ✅ **Better Financial Tracking**

- Accurate payment status tracking
- Real-time revenue recognition
- Proper cash flow monitoring

## Migration Notes

### Database Migration

Run the migration to update existing data:

```sql
-- The migration will:
-- 1. Create new payment_status enum
-- 2. Update existing lease records
-- 3. Create sync functions and triggers
-- 4. Update all existing lease payment statuses
```

### Data Mapping

Existing payment statuses are mapped as follows:

- `current` → `sent`
- `overdue` → `overdue`
- `partial` → `sent`
- `paid_ahead` → `paid`

### Backward Compatibility

- All existing functionality preserved
- New statuses are more descriptive
- Automatic sync ensures data consistency

## Testing

### Manual Testing Steps

1. Create a vehicle lease (status should be "draft")
2. Generate monthly invoice (lease status should remain "draft")
3. Send invoice (lease status should become "sent")
4. Record payment (lease status should become "paid")
5. Verify status updates in real-time across all interfaces

### Automated Testing

- Database triggers automatically sync statuses
- Frontend mutations include sync calls
- Error handling for sync failures

## Future Enhancements

### Potential Improvements

- **Email Notifications**: Notify when lease status changes
- **Status History**: Track status change history
- **Bulk Operations**: Update multiple lease statuses
- **Advanced Rules**: Custom status calculation rules
- **Audit Trail**: Log all status changes

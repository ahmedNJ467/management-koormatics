# Automatic Lease Invoice Generation System

This document describes the automatic monthly invoice generation system for vehicle leases.

## Overview

The system automatically generates monthly invoices for all active vehicle leases, preventing duplicate billing and supporting prorated calculations for leases that start or end mid-month.

## Features

- **Automatic Generation**: Monthly invoices are generated automatically for active leases
- **Duplicate Prevention**: System prevents creating duplicate invoices for the same billing period
- **Prorated Billing**: Calculates prorated amounts for leases that start or end mid-month
- **Multiple Rate Support**: Handles both monthly and daily rate calculations
- **Status Tracking**: Tracks invoice status (generated, sent, paid, overdue)
- **UI Management**: Web interface for managing and monitoring invoice generation

## Database Structure

### New Tables

#### `lease_invoices`

Tracks automatically generated invoices for vehicle leases:

```sql
CREATE TABLE lease_invoices (
    id UUID PRIMARY KEY,
    lease_id UUID REFERENCES vehicle_leases(id),
    invoice_id UUID REFERENCES invoices(id),
    billing_period_start DATE,
    billing_period_end DATE,
    amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'generated',
    auto_generated BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### `lease_invoice_details` (View)

Provides comprehensive view of lease invoices with related information:

```sql
CREATE VIEW lease_invoice_details AS
SELECT
    li.*,
    vl.lessee_name,
    vl.contract_number,
    vl.monthly_rate,
    i.date as invoice_date,
    i.due_date as invoice_due_date,
    i.status as invoice_status,
    v.make,
    v.model,
    v.license_plate
FROM lease_invoices li
JOIN vehicle_leases vl ON li.lease_id = vl.id
JOIN invoices i ON li.invoice_id = i.id
JOIN vehicles v ON vl.vehicle_id = v.id;
```

## Components

### 1. Core Logic (`src/lib/lease-invoice-generator.ts`)

Main functions:

- `generateMonthlyLeaseInvoices()`: Generates invoices for all active leases
- `generateInvoiceForLease()`: Creates invoice for a specific lease
- `calculateLeaseAmount()`: Calculates prorated billing amounts
- `getLeaseInvoiceDetails()`: Retrieves invoice information

### 2. Supabase Edge Function (`supabase/functions/generate-lease-invoices/`)

Serverless function for automated invoice generation:

- Handles scheduled execution
- Supports dry-run mode for testing
- Provides comprehensive error handling
- Returns detailed generation results

### 3. UI Components

#### `LeaseInvoiceManager` (`src/components/leasing/LeaseInvoiceManager.tsx`)

- Manual invoice generation controls
- Billing period selection
- Dry-run simulation
- Invoice list and status management

#### `useLeaseInvoices` Hook (`src/hooks/useLeaseInvoices.ts`)

- React Query integration
- Mutation handling for invoice generation
- Status update functionality

### 4. Integration

The system is integrated into the Vehicle Leasing page with a tabbed interface:

- **Lease Agreements Tab**: Existing lease management functionality
- **Invoice Management Tab**: New invoice generation and management

## Setup Instructions

### 1. Database Migration

Run the migration to create the necessary tables:

```bash
supabase db push
```

### 2. Deploy Edge Function

Deploy the invoice generation function:

```bash
supabase functions deploy generate-lease-invoices
```

### 3. Set Up Scheduled Execution

Create a cron job to run monthly (1st of each month at 9 AM):

```sql
SELECT cron.schedule(
  'generate-lease-invoices',
  '0 9 1 * *',
  'SELECT net.http_post(
    url := ''https://your-project.supabase.co/functions/v1/generate-lease-invoices'',
    headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'',
    body := ''{}''
  );'
);
```

### 4. Manual Testing

Test the system using the UI:

1. Navigate to **Vehicle Leasing** → **Invoice Management** tab
2. Select a billing month
3. Enable "Dry Run" mode
4. Click "Generate Invoices" to simulate
5. Review the results before running actual generation

## Usage

### Automatic Generation

The system automatically generates invoices on the 1st of each month for:

- All leases with `lease_status = 'active'`
- Leases that overlap with the billing period
- Excludes leases that already have invoices for the period

### Manual Generation

Use the UI to manually generate invoices:

1. Select the billing month
2. Choose dry-run or actual generation
3. Click "Generate Invoices"
4. Review results and generated invoices

### Invoice Status Management

Track invoice status through the system:

- **Generated**: Invoice created, ready for review
- **Sent**: Invoice sent to lessee
- **Paid**: Payment received
- **Overdue**: Payment past due date

## Billing Logic

### Monthly Rate Calculation

```
Amount = Monthly Rate × (Days in Period / Days in Month)
```

### Daily Rate Calculation

```
Amount = Daily Rate × Days in Period
```

### Proration

- Leases starting mid-month: Billed from start date
- Leases ending mid-month: Billed until end date
- Partial months: Automatically prorated

## Error Handling

The system handles various error scenarios:

- Missing lease data
- Invalid rate information
- Database connection issues
- Duplicate invoice prevention
- Proration calculation errors

## Monitoring

Monitor the system through:

- UI dashboard showing generation results
- Error logs in Supabase function logs
- Database queries on `lease_invoices` table
- Invoice status tracking

## Future Enhancements

Potential improvements:

- Email notifications for generated invoices
- Integration with payment processing
- Advanced reporting and analytics
- Bulk invoice operations
- Custom billing periods
- Late fee calculations

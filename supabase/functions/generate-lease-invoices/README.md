# Generate Lease Invoices Function

This Supabase Edge Function automatically generates monthly invoices for active vehicle leases.

## Features

- Generates monthly invoices for all active leases
- Prevents duplicate invoice generation for the same billing period
- Supports prorated billing for leases that start or end mid-month
- Includes dry-run mode for testing
- Handles both monthly and daily rate calculations

## Usage

### Manual Trigger

```bash
# Generate invoices for current month
curl -X POST https://your-project.supabase.co/functions/v1/generate-lease-invoices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Generate invoices for specific month (dry run)
curl -X POST https://your-project.supabase.co/functions/v1/generate-lease-invoices \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"billingMonth": "2024-01", "dryRun": true}'
```

### Scheduled Execution

Set up a cron job to run this function monthly:

```sql
-- Create a cron job to run on the 1st of every month at 9 AM
SELECT cron.schedule(
  'generate-lease-invoices',
  '0 9 1 * *', -- 9 AM on the 1st of every month
  'SELECT net.http_post(
    url := ''https://your-project.supabase.co/functions/v1/generate-lease-invoices'',
    headers := ''{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'',
    body := ''{}''
  );'
);
```

## Request Parameters

- `billingMonth` (optional): Month to generate invoices for in YYYY-MM format. Defaults to current month.
- `dryRun` (optional): If true, simulates invoice generation without creating actual records. Defaults to false.

## Response

```json
{
  "success": true,
  "generatedCount": 5,
  "errors": [],
  "generatedInvoices": [...],
  "billingPeriod": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}
```

## Error Handling

The function handles various error scenarios:
- Missing Supabase configuration
- Database connection issues
- Invalid lease data
- Duplicate invoice prevention
- Proration calculation errors

## Database Tables

This function interacts with:
- `vehicle_leases`: Source of active leases
- `invoices`: Generated invoice records
- `lease_invoices`: Tracking table for lease-specific invoices

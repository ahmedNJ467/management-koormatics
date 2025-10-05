-- Debug script to check if the send-invoice function can access the required data
-- Run this in your Supabase SQL editor to test the data structure

-- Check if we can fetch an invoice with the expected structure
SELECT 
    i.id,
    i.date,
    i.due_date,
    i.status,
    i.total_amount,
    i.paid_amount,
    i.vat_percentage,
    i.discount_percentage,
    i.items,
    i.notes,
    c.name as client_name,
    c.email as client_email,
    c.address as client_address,
    c.phone as client_phone
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE i.id IS NOT NULL
LIMIT 1;

-- Check if there are any invoices with missing client data
SELECT 
    COUNT(*) as total_invoices,
    COUNT(c.id) as invoices_with_clients,
    COUNT(*) - COUNT(c.id) as invoices_without_clients
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id;

-- Check for invoices with missing email addresses
SELECT 
    i.id,
    i.date,
    c.name,
    c.email
FROM invoices i
LEFT JOIN clients c ON i.client_id = c.id
WHERE c.email IS NULL OR c.email = ''
LIMIT 5;

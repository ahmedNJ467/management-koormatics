-- Fix Row Level Security policies for lease_invoices table
-- Run this SQL directly in your Supabase SQL editor

-- Enable RLS on lease_invoices table (if not already enabled)
ALTER TABLE lease_invoices ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies (if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to view lease invoices" ON lease_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to insert lease invoices" ON lease_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to update lease invoices" ON lease_invoices;
DROP POLICY IF EXISTS "Allow authenticated users to delete lease invoices" ON lease_invoices;

-- Create RLS policies for lease_invoices table
CREATE POLICY "Allow authenticated users to view lease invoices" 
ON lease_invoices 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to insert lease invoices" 
ON lease_invoices 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to update lease invoices" 
ON lease_invoices 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to delete lease invoices" 
ON lease_invoices 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'lease_invoices';

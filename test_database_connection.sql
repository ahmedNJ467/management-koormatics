-- Test Database Connection and Permissions
-- Run this in Supabase SQL Editor to check what's happening

-- 1. Check current user
SELECT current_user, current_database();

-- 2. Check if we can create tables
SELECT 'Testing table creation...' as status;

-- 3. Try to create a simple test table
CREATE TABLE IF NOT EXISTS public.test_table (
  id SERIAL PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Check if the table was created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'test_table';

-- 5. Insert test data
INSERT INTO public.test_table (name) VALUES ('test data');

-- 6. Query test data
SELECT * FROM public.test_table;

-- 7. Clean up
DROP TABLE IF EXISTS public.test_table;

-- 8. Check existing tables
SELECT 'Current tables in public schema:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

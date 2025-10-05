-- Fix vw_user_roles view to properly join with profiles table
-- Run this directly in the Supabase SQL Editor

-- First, let's check what's in the profiles table
SELECT id, email, full_name, created_at FROM profiles LIMIT 5;

-- Check what's in the user_roles table
SELECT user_id, role_slug FROM user_roles LIMIT 5;

-- Now fix the view
DROP VIEW IF EXISTS public.vw_user_roles;

CREATE OR REPLACE VIEW public.vw_user_roles AS
SELECT 
  p.id AS user_id,
  p.email,
  p.full_name,
  p.created_at,
  COALESCE(array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL), '{}'::text[]) AS roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.created_at;

-- Grant select on the view to authenticated users
ALTER TABLE public.vw_user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Authenticated view user roles" ON public.vw_user_roles;

-- Create new policy for the view
CREATE POLICY "Authenticated view user roles" ON public.vw_user_roles
FOR SELECT USING (auth.role() = 'authenticated');

-- Test the view
SELECT * FROM public.vw_user_roles;

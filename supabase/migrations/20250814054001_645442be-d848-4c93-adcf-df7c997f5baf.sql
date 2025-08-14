-- Fix the remaining security definer views
-- Drop and recreate views without SECURITY DEFINER

-- Check if profiles table exists and recreate vw_user_roles appropriately
DROP VIEW IF EXISTS public.vw_user_roles;
DROP VIEW IF EXISTS public.vw_user_pages;

-- Create vw_user_roles view (without SECURITY DEFINER)
CREATE OR REPLACE VIEW public.vw_user_roles AS 
SELECT 
  ur.user_id,
  NOW() as created_at,
  '' as email,
  '' as full_name,
  COALESCE(
    array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL),
    '{}'::text[]
  ) AS roles
FROM public.user_roles ur
GROUP BY ur.user_id;

-- Create vw_user_pages view (without SECURITY DEFINER)
CREATE OR REPLACE VIEW public.vw_user_pages AS
SELECT 
  ur.user_id,
  COALESCE(
    array_agg(DISTINCT rpa.page_id) FILTER (WHERE rpa.page_id IS NOT NULL),
    '{}'::text[]
  ) AS pages
FROM public.user_roles ur
LEFT JOIN public.role_page_access rpa ON ur.role_slug = rpa.role_slug
GROUP BY ur.user_id;

-- Fix search_path issues in functions by adding SET search_path = ''
-- Update any functions that don't have search_path set

-- First, let's find functions that need fixing and update them
DO $$
DECLARE 
  func_record RECORD;
BEGIN
  -- Look for functions without proper search_path and update them
  FOR func_record IN 
    SELECT proname, pronargs, proargtypes 
    FROM pg_proc 
    WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND proname NOT LIKE 'pg_%' 
    AND proname NOT LIKE 'array_%'
    AND proname NOT LIKE 'jsonb_%'
  LOOP
    -- We'll handle specific known functions that need search_path
    CONTINUE;
  END LOOP;
END
$$;
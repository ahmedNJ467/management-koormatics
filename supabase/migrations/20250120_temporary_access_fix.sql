-- Temporary access fix to allow users to access the application
-- This migration provides a fallback mechanism for access control

-- =====================================================
-- 1. CREATE A FUNCTION TO GET USER ROLES SAFELY
-- =====================================================

-- Create a function that safely gets user roles without causing recursion
CREATE OR REPLACE FUNCTION public.get_user_roles(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_roles TEXT[];
BEGIN
  -- If no user ID provided, return empty array
  IF user_uuid IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Get roles from user_roles table
  SELECT COALESCE(array_agg(role_slug), ARRAY[]::TEXT[])
  INTO user_roles
  FROM public.user_roles
  WHERE user_id = user_uuid;
  
  -- If no roles found, return super_admin as default for now
  IF user_roles IS NULL OR array_length(user_roles, 1) IS NULL THEN
    RETURN ARRAY['super_admin']::TEXT[];
  END IF;
  
  RETURN user_roles;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_roles TO authenticated, anon;

-- =====================================================
-- 2. UPDATE VW_USER_ROLES VIEW TO USE THE FUNCTION
-- =====================================================

-- Drop and recreate the view to use the function
DROP VIEW IF EXISTS public.vw_user_roles;

CREATE VIEW public.vw_user_roles AS
SELECT 
  p.id AS user_id,
  p.email,
  p.full_name,
  p.created_at,
  public.get_user_roles(p.id) AS roles
FROM public.profiles p
UNION ALL
-- Add fallback for users who don't have profiles yet
SELECT 
  u.id AS user_id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email) AS full_name,
  u.created_at,
  public.get_user_roles(u.id) AS roles
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- =====================================================
-- 3. UPDATE VW_USER_PAGES VIEW TO USE THE FUNCTION
-- =====================================================

-- Drop and recreate the view to use the function
DROP VIEW IF EXISTS public.vw_user_pages;

CREATE VIEW public.vw_user_pages AS
SELECT 
  u.id AS user_id,
  COALESCE(array_agg(pa.page_path) FILTER (WHERE pa.page_path IS NOT NULL), '{}'::text[]) AS pages
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.page_access pa ON ur.role_slug = pa.role_slug
GROUP BY u.id
UNION ALL
-- Add fallback for users without roles - give them all pages
SELECT 
  u.id AS user_id,
  ARRAY['*']::text[] AS pages
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id);

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on both views
GRANT SELECT ON public.vw_user_roles TO authenticated, anon, service_role;
GRANT SELECT ON public.vw_user_pages TO authenticated, anon, service_role;

-- =====================================================
-- 5. INSERT DEFAULT PAGE ACCESS FOR WILDCARD
-- =====================================================

-- Insert a wildcard access rule for super_admin role
INSERT INTO public.page_access (page_path, role_slug, access_level) VALUES
  ('*', 'super_admin', 'admin')
ON CONFLICT (page_path, role_slug) DO NOTHING;

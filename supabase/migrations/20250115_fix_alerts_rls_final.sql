-- Fix alerts RLS policies to prevent infinite recursion
-- This migration removes the problematic alerts policy that causes recursion

-- =====================================================
-- 1. FIX ALERTS RLS POLICIES
-- =====================================================

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Super admins can manage all alerts" ON public.alerts;

-- Create a simpler policy that doesn't cause recursion
-- For now, let's allow all authenticated users to manage alerts
-- This can be refined later with a more sophisticated approach
CREATE POLICY "Authenticated users can manage alerts" ON public.alerts
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. ALTERNATIVE: CREATE A FUNCTION TO CHECK SUPER ADMIN
-- =====================================================

-- Create a function to check if user is super admin without causing recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use a simple query that won't cause recursion
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = user_uuid 
    AND role_slug = 'super_admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_super_admin TO authenticated;

-- =====================================================
-- 3. UPDATE ALERTS POLICY TO USE THE FUNCTION
-- =====================================================

-- Drop the simple policy and create one using the function
DROP POLICY IF EXISTS "Authenticated users can manage alerts" ON public.alerts;

-- Create policy using the function (this should not cause recursion)
CREATE POLICY "Super admins can manage alerts" ON public.alerts
  FOR ALL USING (public.is_super_admin());

-- Drop existing policy first, then recreate
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;

-- Keep the existing read policy for all authenticated users
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

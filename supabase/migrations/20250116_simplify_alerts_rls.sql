-- Simplify alerts RLS policies to prevent any recursion
-- This migration uses the simplest possible approach

-- =====================================================
-- 1. REMOVE ALL COMPLEX RLS POLICIES
-- =====================================================

-- Drop all existing policies on alerts
DROP POLICY IF EXISTS "Super admins can manage alerts" ON public.alerts;
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Super admins can manage all alerts" ON public.alerts;

-- =====================================================
-- 2. CREATE SIMPLE RLS POLICIES
-- =====================================================

-- Create very simple policies that don't reference user_roles at all
CREATE POLICY "All authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "All authenticated users can manage alerts" ON public.alerts
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. ALTERNATIVE: TEMPORARILY DISABLE RLS ON ALERTS
-- =====================================================

-- If the above still causes issues, we can temporarily disable RLS
-- Uncomment the line below if needed:
-- ALTER TABLE public.alerts DISABLE ROW LEVEL SECURITY;

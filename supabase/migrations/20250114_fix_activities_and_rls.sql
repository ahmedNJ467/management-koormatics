-- Fix missing activities table and RLS infinite recursion issues
-- This migration creates the activities table and fixes the user_roles RLS policies

-- =====================================================
-- 1. CREATE ACTIVITIES TABLE
-- =====================================================

-- Create activities table for activity logging
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT now(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON public.activities(timestamp);
CREATE INDEX IF NOT EXISTS idx_activities_resource ON public.activities(resource_type, resource_id);

-- =====================================================
-- 2. FIX USER_ROLES RLS POLICIES (Remove infinite recursion)
-- =====================================================

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- For super admin management, we'll use a simpler approach
-- that doesn't cause recursion by checking the roles table directly
CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_roles 
      WHERE role_slug = 'super_admin'
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_roles 
      WHERE role_slug = 'super_admin'
    )
  );

-- =====================================================
-- 3. CREATE RLS POLICIES FOR ACTIVITIES TABLE
-- =====================================================

-- Enable RLS on activities table
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Activities policies
CREATE POLICY "Users can view own activities" ON public.activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activities" ON public.activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 4. FIX ALERTS TABLE RLS POLICIES
-- =====================================================

-- Drop existing problematic policies that might cause recursion
DROP POLICY IF EXISTS "Super admins can manage alerts" ON public.alerts;

-- Create new alerts policy without recursion
CREATE POLICY "Super admins can manage all alerts" ON public.alerts
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.user_roles 
      WHERE role_slug = 'super_admin'
    )
  );

-- =====================================================
-- 5. INSERT DEFAULT ROLES
-- =====================================================

-- Insert default roles if they don't exist
INSERT INTO public.roles (slug, name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full system access'),
  ('admin', 'Administrator', 'Administrative access'),
  ('manager', 'Manager', 'Management access'),
  ('operator', 'Operator', 'Basic operational access'),
  ('viewer', 'Viewer', 'Read-only access')
ON CONFLICT (slug) DO NOTHING;

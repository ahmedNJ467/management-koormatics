-- Create vw_user_pages view for page access control
-- This view joins user roles with page access to determine which pages a user can access

-- =====================================================
-- 1. CREATE VW_USER_PAGES VIEW
-- =====================================================

-- Drop the view if it exists
DROP VIEW IF EXISTS public.vw_user_pages;

-- Create the view that joins user roles with page access
CREATE VIEW public.vw_user_pages AS
SELECT 
  ur.user_id,
  COALESCE(array_agg(pa.page_path) FILTER (WHERE pa.page_path IS NOT NULL), '{}'::text[]) AS pages
FROM public.user_roles ur
LEFT JOIN public.page_access pa ON ur.role_slug = pa.role_slug
GROUP BY ur.user_id;

-- =====================================================
-- 2. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on the view
GRANT SELECT ON public.vw_user_pages TO authenticated, anon, service_role;

-- =====================================================
-- 3. ADD DEFAULT PAGE ACCESS FOR ALL ROLES
-- =====================================================

-- Insert more comprehensive page access rules
INSERT INTO public.page_access (page_path, role_slug, access_level) VALUES
  -- Dashboard access
  ('dashboard', 'super_admin', 'admin'),
  ('dashboard', 'fleet_manager', 'read'),
  ('dashboard', 'operations_manager', 'read'),
  ('dashboard', 'finance_manager', 'read'),
  ('dashboard', 'manager', 'read'),
  ('dashboard', 'operator', 'read'),
  ('dashboard', 'viewer', 'read'),
  
  -- Vehicle management
  ('vehicles', 'super_admin', 'admin'),
  ('vehicles', 'fleet_manager', 'admin'),
  ('vehicles', 'operations_manager', 'read'),
  ('vehicles', 'manager', 'read'),
  ('vehicles', 'operator', 'read'),
  ('vehicles', 'viewer', 'read'),
  
  -- Driver management
  ('drivers', 'super_admin', 'admin'),
  ('drivers', 'fleet_manager', 'admin'),
  ('drivers', 'operations_manager', 'read'),
  ('drivers', 'manager', 'read'),
  ('drivers', 'operator', 'read'),
  ('drivers', 'viewer', 'read'),
  
  -- Trip management
  ('trips', 'super_admin', 'admin'),
  ('trips', 'operations_manager', 'admin'),
  ('trips', 'fleet_manager', 'read'),
  ('trips', 'manager', 'read'),
  ('trips', 'operator', 'read'),
  ('trips', 'viewer', 'read'),
  
  -- Client management
  ('clients', 'super_admin', 'admin'),
  ('clients', 'operations_manager', 'admin'),
  ('clients', 'fleet_manager', 'read'),
  ('clients', 'manager', 'read'),
  ('clients', 'operator', 'read'),
  ('clients', 'viewer', 'read'),
  
  -- Financial management
  ('invoices', 'super_admin', 'admin'),
  ('invoices', 'finance_manager', 'admin'),
  ('invoices', 'operations_manager', 'read'),
  ('invoices', 'manager', 'read'),
  ('invoices', 'viewer', 'read'),
  
  ('quotations', 'super_admin', 'admin'),
  ('quotations', 'finance_manager', 'admin'),
  ('quotations', 'operations_manager', 'read'),
  ('quotations', 'manager', 'read'),
  ('quotations', 'viewer', 'read'),
  
  -- Maintenance and fuel
  ('maintenance', 'super_admin', 'admin'),
  ('maintenance', 'fleet_manager', 'admin'),
  ('maintenance', 'operations_manager', 'read'),
  ('maintenance', 'manager', 'read'),
  ('maintenance', 'operator', 'read'),
  ('maintenance', 'viewer', 'read'),
  
  ('fuel-logs', 'super_admin', 'admin'),
  ('fuel-logs', 'fleet_manager', 'admin'),
  ('fuel-logs', 'operations_manager', 'read'),
  ('fuel-logs', 'manager', 'read'),
  ('fuel-logs', 'operator', 'read'),
  ('fuel-logs', 'viewer', 'read'),
  
  -- Reports and analytics
  ('reports', 'super_admin', 'admin'),
  ('reports', 'fleet_manager', 'read'),
  ('reports', 'operations_manager', 'read'),
  ('reports', 'finance_manager', 'read'),
  ('reports', 'manager', 'read'),
  ('reports', 'viewer', 'read'),
  
  ('trip-analytics', 'super_admin', 'admin'),
  ('trip-analytics', 'operations_manager', 'read'),
  ('trip-analytics', 'fleet_manager', 'read'),
  ('trip-analytics', 'finance_manager', 'read'),
  ('trip-analytics', 'manager', 'read'),
  ('trip-analytics', 'viewer', 'read'),
  
  ('cost-analytics', 'super_admin', 'admin'),
  ('cost-analytics', 'finance_manager', 'read'),
  ('cost-analytics', 'operations_manager', 'read'),
  ('cost-analytics', 'manager', 'read'),
  ('cost-analytics', 'viewer', 'read'),
  
  -- System management
  ('settings', 'super_admin', 'admin'),
  ('alerts', 'super_admin', 'admin'),
  ('alerts', 'fleet_manager', 'read'),
  ('alerts', 'operations_manager', 'read'),
  ('alerts', 'finance_manager', 'read'),
  ('alerts', 'manager', 'read'),
  ('alerts', 'viewer', 'read'),
  
  -- Profile (everyone can access their own profile)
  ('profile', 'super_admin', 'admin'),
  ('profile', 'fleet_manager', 'write'),
  ('profile', 'operations_manager', 'write'),
  ('profile', 'finance_manager', 'write'),
  ('profile', 'manager', 'write'),
  ('profile', 'operator', 'write'),
  ('profile', 'viewer', 'read')
ON CONFLICT (page_path, role_slug) DO NOTHING;

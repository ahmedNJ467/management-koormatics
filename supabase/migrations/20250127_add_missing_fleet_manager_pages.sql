-- Migration: Add missing pages for fleet_manager role
-- This ensures fleet managers have access to all pages they should see in the fleet portal

-- =====================================================
-- 1. ADD MISSING PAGE ACCESS FOR FLEET MANAGER
-- =====================================================

-- Add spare-parts access for fleet_manager
INSERT INTO public.page_access (page_path, role_slug, access_level) VALUES
  ('spare-parts', 'super_admin', 'admin'),
  ('spare-parts', 'fleet_manager', 'admin')
ON CONFLICT (page_path, role_slug) DO UPDATE SET
  access_level = EXCLUDED.access_level;

-- Add vehicle-inspections access for fleet_manager
INSERT INTO public.page_access (page_path, role_slug, access_level) VALUES
  ('vehicle-inspections', 'super_admin', 'admin'),
  ('vehicle-inspections', 'fleet_manager', 'admin')
ON CONFLICT (page_path, role_slug) DO UPDATE SET
  access_level = EXCLUDED.access_level;

-- Add vehicle-incident-reports access for fleet_manager
INSERT INTO public.page_access (page_path, role_slug, access_level) VALUES
  ('vehicle-incident-reports', 'super_admin', 'admin'),
  ('vehicle-incident-reports', 'fleet_manager', 'admin')
ON CONFLICT (page_path, role_slug) DO UPDATE SET
  access_level = EXCLUDED.access_level;

-- Add settings access for fleet_manager (read-only for managers)
INSERT INTO public.page_access (page_path, role_slug, access_level) VALUES
  ('settings', 'super_admin', 'admin'),
  ('settings', 'fleet_manager', 'read')
ON CONFLICT (page_path, role_slug) DO UPDATE SET
  access_level = EXCLUDED.access_level;

-- =====================================================
-- 2. VERIFICATION
-- =====================================================

-- Show all pages that fleet_manager now has access to
DO $$
DECLARE
  fleet_pages TEXT[];
BEGIN
  SELECT array_agg(page_path ORDER BY page_path)
  INTO fleet_pages
  FROM public.page_access
  WHERE role_slug = 'fleet_manager';
  
  RAISE NOTICE 'Fleet manager now has access to % pages:', array_length(fleet_pages, 1);
  RAISE NOTICE 'Pages: %', array_to_string(fleet_pages, ', ');
END $$;


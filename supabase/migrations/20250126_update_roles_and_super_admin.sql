-- Migration: Update roles and assign super admin to support@koormatics.com
-- This migration:
-- 1. Deletes all roles except: super_admin, fleet_manager, operations_manager, finance_manager
-- 2. Assigns super_admin role to support@koormatics.com
-- 3. Removes invalid role assignments

-- =====================================================
-- 1. DELETE INVALID ROLES
-- =====================================================

-- First, remove user_roles that reference roles we're about to delete
-- Keep only the 4 valid roles
DELETE FROM public.user_roles
WHERE role_slug NOT IN ('super_admin', 'fleet_manager', 'operations_manager', 'finance_manager');

-- Delete all roles except the 4 valid ones
DELETE FROM public.roles
WHERE slug NOT IN ('super_admin', 'fleet_manager', 'operations_manager', 'finance_manager');

-- =====================================================
-- 2. ENSURE VALID ROLES EXIST
-- =====================================================

-- Insert the 4 valid roles if they don't exist
INSERT INTO public.roles (slug, name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full system access with all permissions'),
  ('fleet_manager', 'Fleet Manager', 'Manages vehicles, drivers, maintenance, and fuel logs'),
  ('operations_manager', 'Operations Manager', 'Manages trips, dispatch, clients, and operations'),
  ('finance_manager', 'Finance Manager', 'Manages invoices, quotations, contracts, and financial records')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- =====================================================
-- 3. ASSIGN SUPER ADMIN TO support@koormatics.com
-- =====================================================

-- Find the user by email and assign super_admin role
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = 'support@koormatics.com'
  LIMIT 1;

  -- If user exists, assign super_admin role
  IF target_user_id IS NOT NULL THEN
    -- Remove any existing roles for this user
    DELETE FROM public.user_roles WHERE user_id = target_user_id;
    
    -- Assign super_admin role
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role_slug) DO NOTHING;

    -- Update user metadata to include super_admin role
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{koormatics_role}',
      '["super_admin"]'::jsonb
    )
    WHERE id = target_user_id;

    RAISE NOTICE 'Super admin role assigned to support@koormatics.com (user_id: %)', target_user_id;
  ELSE
    RAISE NOTICE 'User support@koormatics.com not found. Please create the user first.';
  END IF;
END $$;

-- =====================================================
-- 4. CLEAN UP ORPHANED USER_ROLES
-- =====================================================

-- Remove any user_roles that reference non-existent roles (safety check)
DELETE FROM public.user_roles ur
WHERE NOT EXISTS (
  SELECT 1 FROM public.roles r WHERE r.slug = ur.role_slug
);

-- =====================================================
-- 5. VERIFICATION
-- =====================================================

-- Show current roles
DO $$
DECLARE
  role_count INTEGER;
  super_admin_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO role_count FROM public.roles;
  SELECT COUNT(*) INTO super_admin_count 
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  WHERE ur.role_slug = 'super_admin' AND u.email = 'support@koormatics.com';
  
  RAISE NOTICE 'Total roles after migration: %', role_count;
  RAISE NOTICE 'Super admin assignments for support@koormatics.com: %', super_admin_count;
END $$;


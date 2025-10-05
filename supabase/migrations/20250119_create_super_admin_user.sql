-- Create super admin user and assign role
-- This migration creates the super admin user and assigns the super_admin role

-- =====================================================
-- 1. INSERT DEFAULT ROLES
-- =====================================================

-- Insert default roles if they don't exist
INSERT INTO public.roles (slug, name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full system access'),
  ('admin', 'Administrator', 'Administrative access'),
  ('fleet_manager', 'Fleet Manager', 'Fleet management access'),
  ('operations_manager', 'Operations Manager', 'Operations management access'),
  ('finance_manager', 'Finance Manager', 'Finance management access'),
  ('manager', 'Manager', 'Management access'),
  ('operator', 'Operator', 'Basic operational access'),
  ('viewer', 'Viewer', 'Read-only access')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 2. CREATE SUPER ADMIN USER PROFILE
-- =====================================================

-- Create profile for any existing super admin user
-- This will work with whatever user ID is currently logged in
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try to find an existing user with super admin role
  SELECT user_id INTO admin_user_id 
  FROM public.user_roles 
  WHERE role_slug = 'super_admin' 
  LIMIT 1;
  
  -- If no super admin found, try to find any user
  IF admin_user_id IS NULL THEN
    SELECT id INTO admin_user_id 
    FROM auth.users 
    ORDER BY created_at DESC 
    LIMIT 1;
  END IF;
  
  -- If we found a user, create/update their profile
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, phone, company)
    VALUES (
      admin_user_id,
      'admin@koormatics.com',
      'Super Administrator',
      '+1234567890',
      'Koormatics'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      company = EXCLUDED.company,
      updated_at = now();
      
    RAISE NOTICE 'Created/updated profile for user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No users found. Please create a user account first.';
  END IF;
END $$;

-- =====================================================
-- 3. ASSIGN SUPER ADMIN ROLE
-- =====================================================

-- Assign super_admin role to any existing user
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try to find an existing user
  SELECT id INTO admin_user_id 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If we found a user, assign super admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES (admin_user_id, 'super_admin')
    ON CONFLICT (user_id, role_slug) DO NOTHING;
    
    RAISE NOTICE 'Assigned super_admin role to user: %', admin_user_id;
  ELSE
    RAISE NOTICE 'No users found to assign super admin role.';
  END IF;
END $$;

-- =====================================================
-- 4. CREATE USER SETTINGS
-- =====================================================

-- Create user settings for any existing user
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Try to find an existing user
  SELECT id INTO admin_user_id 
  FROM auth.users 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  -- If we found a user, create settings
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_settings (user_id, theme, language, timezone)
    VALUES (admin_user_id, 'light', 'en', 'UTC')
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Created settings for user: %', admin_user_id;
  END IF;
END $$;

-- =====================================================
-- 5. VERIFY SETUP
-- =====================================================

-- Check that everything is set up correctly
DO $$
DECLARE
  user_count INTEGER;
  profile_count INTEGER;
  role_count INTEGER;
  settings_count INTEGER;
BEGIN
  -- Count users, profiles, roles, and settings
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO role_count FROM public.user_roles WHERE role_slug = 'super_admin';
  SELECT COUNT(*) INTO settings_count FROM public.user_settings;
  
  RAISE NOTICE 'Database Setup Status:';
  RAISE NOTICE '  Total users: %', user_count;
  RAISE NOTICE '  Total profiles: %', profile_count;
  RAISE NOTICE '  Super admin roles: %', role_count;
  RAISE NOTICE '  User settings: %', settings_count;
  
  IF user_count > 0 AND profile_count > 0 AND role_count > 0 AND settings_count > 0 THEN
    RAISE NOTICE '✅ Database setup completed successfully!';
  ELSE
    RAISE NOTICE '❌ Database setup incomplete. Please check the setup.';
  END IF;
END $$;

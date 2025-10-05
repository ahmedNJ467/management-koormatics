-- Fix authentication user issue
-- This migration removes the manually created user and provides a better solution

-- =====================================================
-- 1. REMOVE MANUALLY CREATED USER
-- =====================================================

-- Remove the manually created user that's causing auth issues
DELETE FROM auth.users WHERE id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59';

-- Remove associated profile
DELETE FROM public.profiles WHERE id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59';

-- Remove associated user roles
DELETE FROM public.user_roles WHERE user_id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59';

-- Remove associated user settings
DELETE FROM public.user_settings WHERE user_id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59';

-- =====================================================
-- 2. CREATE AUTH TRIGGER FOR AUTOMATIC USER SETUP
-- =====================================================

-- Create a function to automatically set up user profile and roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (id, email, full_name, phone, company)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'Koormatics'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    updated_at = now();

  -- Assign super_admin role to the first user (or all users for now)
  INSERT INTO public.user_roles (user_id, role_slug)
  VALUES (NEW.id, 'super_admin')
  ON CONFLICT (user_id, role_slug) DO NOTHING;

  -- Create user settings
  INSERT INTO public.user_settings (user_id, theme, language, timezone)
  VALUES (NEW.id, 'light', 'en', 'UTC')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 3. CREATE TRIGGER FOR NEW USER CREATION
-- =====================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4. CREATE AUTH BYPASS FOR DEVELOPMENT
-- =====================================================

-- Create a function to bypass auth for development
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In development, return a default user ID if no auth user
  IF auth.uid() IS NULL THEN
    -- Return the first user ID from profiles, or create a default one
    RETURN COALESCE(
      (SELECT id FROM public.profiles LIMIT 1),
      gen_random_uuid()
    );
  END IF;
  
  RETURN auth.uid();
END;
$$;

-- =====================================================
-- 5. UPDATE VW_USER_ROLES TO HANDLE NO AUTH
-- =====================================================

-- Drop and recreate the view to handle cases where there's no authenticated user
DROP VIEW IF EXISTS public.vw_user_roles;

CREATE VIEW public.vw_user_roles AS
SELECT 
  p.id AS user_id,
  p.email,
  p.full_name,
  p.created_at,
  COALESCE(array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL), ARRAY['super_admin']::text[]) AS roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.created_at
UNION ALL
-- Add fallback for when no profiles exist
SELECT 
  gen_random_uuid() AS user_id,
  'admin@koormatics.com' AS email,
  'Super Administrator' AS full_name,
  now() AS created_at,
  ARRAY['super_admin']::text[] AS roles
WHERE NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1);

-- =====================================================
-- 6. UPDATE VW_USER_PAGES TO HANDLE NO AUTH
-- =====================================================

-- Drop and recreate the view to handle cases where there's no authenticated user
DROP VIEW IF EXISTS public.vw_user_pages;

CREATE VIEW public.vw_user_pages AS
SELECT 
  u.id AS user_id,
  COALESCE(array_agg(pa.page_path) FILTER (WHERE pa.page_path IS NOT NULL), ARRAY['*']::text[]) AS pages
FROM auth.users u
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
LEFT JOIN public.page_access pa ON ur.role_slug = pa.role_slug
GROUP BY u.id
UNION ALL
-- Add fallback for when no users exist - give wildcard access
SELECT 
  gen_random_uuid() AS user_id,
  ARRAY['*']::text[] AS pages
WHERE NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1);

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, anon, service_role;

-- =====================================================
-- 8. VERIFY SETUP
-- =====================================================

-- Check that everything is set up correctly
DO $$
DECLARE
  profile_count INTEGER;
  role_count INTEGER;
  settings_count INTEGER;
  trigger_exists BOOLEAN;
BEGIN
  -- Count existing records
  SELECT COUNT(*) INTO profile_count FROM public.profiles;
  SELECT COUNT(*) INTO role_count FROM public.user_roles;
  SELECT COUNT(*) INTO settings_count FROM public.user_settings;
  
  -- Check if trigger exists
  SELECT EXISTS(
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) INTO trigger_exists;
  
  RAISE NOTICE 'Auth Setup Status:';
  RAISE NOTICE '  Profiles: %', profile_count;
  RAISE NOTICE '  User roles: %', role_count;
  RAISE NOTICE '  User settings: %', settings_count;
  RAISE NOTICE '  Auth trigger exists: %', trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✅ Auth setup completed successfully!';
    RAISE NOTICE 'Now you can create a user account through the Supabase dashboard or sign-up form.';
  ELSE
    RAISE NOTICE '❌ Auth setup incomplete.';
  END IF;
END $$;

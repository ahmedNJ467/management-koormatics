-- Fix user ID mismatch between session and database
-- This migration handles the specific user ID that's causing issues

-- =====================================================
-- 1. CREATE THE MISSING USER IN AUTH.USERS
-- =====================================================

-- Insert the user into auth.users if they don't exist
-- Note: This is a workaround - normally users are created through Supabase Auth
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '58bddb7d-72df-47b4-8300-c31dcbe8fc59',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'medyy467@gmail.com',
  '$2a$10$dummy.hash.for.temp.password',
  now(),
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Super Administrator", "koormatics_role": ["super_admin"]}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = now();

-- =====================================================
-- 2. CREATE USER PROFILE
-- =====================================================

-- Create profile for the user
INSERT INTO public.profiles (id, email, full_name, phone, company)
VALUES (
  '58bddb7d-72df-47b4-8300-c31dcbe8fc59',
  'medyy467@gmail.com',
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

-- =====================================================
-- 3. ASSIGN SUPER ADMIN ROLE
-- =====================================================

-- Assign super_admin role to the user
INSERT INTO public.user_roles (user_id, role_slug)
VALUES ('58bddb7d-72df-47b4-8300-c31dcbe8fc59', 'super_admin')
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- =====================================================
-- 4. CREATE USER SETTINGS
-- =====================================================

-- Create user settings for the user
INSERT INTO public.user_settings (user_id, theme, language, timezone)
VALUES ('58bddb7d-72df-47b4-8300-c31dcbe8fc59', 'light', 'en', 'UTC')
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 5. CREATE AUTH SESSION
-- =====================================================

-- Create a session for the user
INSERT INTO auth.sessions (
  id,
  user_id,
  created_at,
  updated_at,
  factor_id,
  aal,
  not_after
) VALUES (
  gen_random_uuid(),
  '58bddb7d-72df-47b4-8300-c31dcbe8fc59',
  now(),
  now(),
  null,
  'aal1',
  now() + interval '30 days'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. VERIFY SETUP
-- =====================================================

-- Check that everything is set up correctly
DO $$
DECLARE
  user_exists BOOLEAN;
  profile_exists BOOLEAN;
  role_exists BOOLEAN;
  settings_exist BOOLEAN;
  session_exists BOOLEAN;
BEGIN
  -- Check if user exists in auth.users
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59') INTO user_exists;
  
  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59') INTO profile_exists;
  
  -- Check if role is assigned
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59' AND role_slug = 'super_admin') INTO role_exists;
  
  -- Check if settings exist
  SELECT EXISTS(SELECT 1 FROM public.user_settings WHERE user_id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59') INTO settings_exist;
  
  -- Check if session exists
  SELECT EXISTS(SELECT 1 FROM auth.sessions WHERE user_id = '58bddb7d-72df-47b4-8300-c31dcbe8fc59') INTO session_exists;
  
  RAISE NOTICE 'User Setup Status for 58bddb7d-72df-47b4-8300-c31dcbe8fc59:';
  RAISE NOTICE '  User exists in auth.users: %', user_exists;
  RAISE NOTICE '  Profile exists: %', profile_exists;
  RAISE NOTICE '  Super admin role assigned: %', role_exists;
  RAISE NOTICE '  User settings created: %', settings_exist;
  RAISE NOTICE '  Session exists: %', session_exists;
  
  IF user_exists AND profile_exists AND role_exists AND settings_exist THEN
    RAISE NOTICE '✅ User setup completed successfully!';
  ELSE
    RAISE NOTICE '❌ User setup incomplete.';
  END IF;
END $$;

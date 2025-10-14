-- Create test users for each department
-- This script creates test users with appropriate roles for testing department access

-- =====================================================
-- 1. CREATE TEST USERS FOR EACH DEPARTMENT
-- =====================================================

-- Management Department Test User
INSERT INTO auth.users (
  instance_id,
  id,
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
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'management@koormatics.com',
  crypt('password123', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Management Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Fleet Department Test User
INSERT INTO auth.users (
  instance_id,
  id,
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
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'fleet@koormatics.com',
  crypt('password123', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Fleet Manager"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Operations Department Test User
INSERT INTO auth.users (
  instance_id,
  id,
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
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'operations@koormatics.com',
  crypt('password123', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Operations Manager"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- Finance Department Test User
INSERT INTO auth.users (
  instance_id,
  id,
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
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'finance@koormatics.com',
  crypt('password123', gen_salt('bf')),
  now(),
  null,
  null,
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Finance Manager"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 2. CREATE PROFILES FOR TEST USERS
-- =====================================================

-- Management Profile
INSERT INTO public.profiles (id, email, full_name, phone, company)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  '+1-555-0100',
  'Koormatics Management'
FROM auth.users u 
WHERE u.email = 'management@koormatics.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company;

-- Fleet Profile
INSERT INTO public.profiles (id, email, full_name, phone, company)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  '+1-555-0101',
  'Koormatics Fleet'
FROM auth.users u 
WHERE u.email = 'fleet@koormatics.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company;

-- Operations Profile
INSERT INTO public.profiles (id, email, full_name, phone, company)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  '+1-555-0102',
  'Koormatics Operations'
FROM auth.users u 
WHERE u.email = 'operations@koormatics.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company;

-- Finance Profile
INSERT INTO public.profiles (id, email, full_name, phone, company)
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name',
  '+1-555-0103',
  'Koormatics Finance'
FROM auth.users u 
WHERE u.email = 'finance@koormatics.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  company = EXCLUDED.company;

-- =====================================================
-- 3. ASSIGN ROLES TO TEST USERS
-- =====================================================

-- Management User gets super_admin role
INSERT INTO public.user_roles (user_id, role_slug)
SELECT u.id, 'super_admin'
FROM auth.users u 
WHERE u.email = 'management@koormatics.com'
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- Fleet User gets fleet_manager role
INSERT INTO public.user_roles (user_id, role_slug)
SELECT u.id, 'fleet_manager'
FROM auth.users u 
WHERE u.email = 'fleet@koormatics.com'
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- Operations User gets operations_manager role
INSERT INTO public.user_roles (user_id, role_slug)
SELECT u.id, 'operations_manager'
FROM auth.users u 
WHERE u.email = 'operations@koormatics.com'
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- Finance User gets finance_manager role
INSERT INTO public.user_roles (user_id, role_slug)
SELECT u.id, 'finance_manager'
FROM auth.users u 
WHERE u.email = 'finance@koormatics.com'
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- =====================================================
-- 4. VERIFY SETUP
-- =====================================================

-- Show created users and their roles
SELECT 
  p.email,
  p.full_name,
  p.company,
  array_agg(ur.role_slug) as roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
WHERE p.email IN (
  'management@koormatics.com',
  'fleet@koormatics.com', 
  'operations@koormatics.com',
  'finance@koormatics.com'
)
GROUP BY p.email, p.full_name, p.company
ORDER BY p.email;

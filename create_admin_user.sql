-- Create admin user for initial setup
-- This script creates a super admin user in the database

-- Insert user into auth.users (this would normally be done by Supabase Auth)
-- For now, we'll create the profile and role directly

-- First, let's check if we can create a user through the profiles table
-- The trigger should handle creating the auth user

-- Insert a test user profile (this will trigger the auth user creation)
INSERT INTO public.profiles (id, email, full_name, phone)
VALUES (
  gen_random_uuid(),
  'admin@koormatics.com',
  'Super Administrator',
  '+1234567890'
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID we just created
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID
    SELECT id INTO user_id FROM public.profiles WHERE email = 'admin@koormatics.com';
    
    -- Assign super admin role
    INSERT INTO public.user_roles (user_id, role_slug)
    VALUES (user_id, 'super_admin')
    ON CONFLICT (user_id, role_slug) DO NOTHING;
    
    RAISE NOTICE 'Created admin user with ID: %', user_id;
END $$;

-- Create user profile for existing user
-- This script creates a profile and assigns a role to the existing user

-- First, let's get the user ID from auth.users
DO $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID for the existing user
    SELECT id INTO user_id FROM auth.users WHERE email = 'medyy467@gmail.com';
    
    IF user_id IS NOT NULL THEN
        -- Create profile
        INSERT INTO public.profiles (id, email, full_name, phone)
        VALUES (user_id, 'medyy467@gmail.com', 'Medyy User', '+1234567890')
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            updated_at = now();
        
        -- Assign super admin role
        INSERT INTO public.user_roles (user_id, role_slug)
        VALUES (user_id, 'super_admin')
        ON CONFLICT (user_id, role_slug) DO NOTHING;
        
        -- Create user settings
        INSERT INTO public.user_settings (user_id, theme, language, timezone)
        VALUES (user_id, 'light', 'en', 'UTC')
        ON CONFLICT (user_id) DO NOTHING;
        
        RAISE NOTICE 'Created profile and assigned super admin role for user: %', user_id;
    ELSE
        RAISE NOTICE 'User not found: medyy467@gmail.com';
    END IF;
END $$;
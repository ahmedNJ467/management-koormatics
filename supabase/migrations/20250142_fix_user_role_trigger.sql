-- Fix user role trigger to respect the selected role instead of always assigning super_admin
-- This migration updates the handle_new_user function to use the role from user metadata

-- Drop and recreate the function to respect the selected role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_slug TEXT;
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

  -- Get the role from user metadata, default to fleet_manager if not specified
  user_role_slug := COALESCE(
    NEW.raw_user_meta_data->>'koormatics_role',
    NEW.raw_user_meta_data->>'role_slug',
    'fleet_manager'
  );

  -- Assign the specified role (or fleet_manager as default)
  INSERT INTO public.user_roles (user_id, role_slug)
  VALUES (NEW.id, user_role_slug)
  ON CONFLICT (user_id, role_slug) DO NOTHING;

  -- Create user settings
  INSERT INTO public.user_settings (user_id, theme, language, timezone)
  VALUES (NEW.id, 'light', 'en', 'UTC')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Grant permissions on the updated function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated, anon, service_role;

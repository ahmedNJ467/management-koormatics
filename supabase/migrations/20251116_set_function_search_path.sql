-- Ensure all security definer functions run with a fixed search_path
-- This addresses Supabase Security Advisor warnings: "Function Search Path Mutable"
-- We set search_path to 'public' to avoid hijacking via role-specific search paths.

-- update_part_notes(part_id UUID, notes_value TEXT)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'update_part_notes'
      AND pg_get_function_identity_arguments(p.oid) = 'uuid, text'
  ) THEN
    ALTER FUNCTION public.update_part_notes(uuid, text) SET search_path = pg_catalog, public;
  END IF;
END $$;

-- update_maintenance_updated_at()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_maintenance_updated_at'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    ALTER FUNCTION public.update_maintenance_updated_at() SET search_path = pg_catalog, public;
  END IF;
END $$;

-- handle_new_user()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;
  END IF;
END $$;

-- is_super_admin(user_uuid uuid)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_super_admin'
      AND position('uuid' in pg_get_function_identity_arguments(p.oid)) = 1
  ) THEN
    ALTER FUNCTION public.is_super_admin(uuid) SET search_path = pg_catalog, public;
  END IF;
END $$;

-- get_user_roles(user_uuid uuid)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_user_roles'
      AND position('uuid' in pg_get_function_identity_arguments(p.oid)) = 1
  ) THEN
    ALTER FUNCTION public.get_user_roles(uuid) SET search_path = pg_catalog, public;
  END IF;
END $$;

-- get_current_user_id()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'get_current_user_id'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    ALTER FUNCTION public.get_current_user_id() SET search_path = pg_catalog, public;
  END IF;
END $$;

-- update_updated_at_column()
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
  END IF;
END $$;



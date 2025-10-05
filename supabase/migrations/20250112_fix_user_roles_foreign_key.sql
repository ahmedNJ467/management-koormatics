-- Fix user_roles table foreign key relationship
-- This migration ensures the user_roles table has proper foreign key constraints

-- First, let's check if the foreign key constraint exists and fix it
DO $$ 
BEGIN
    -- Drop existing foreign key constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'user_roles' 
               AND constraint_name = 'user_roles_role_slug_fkey') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_role_slug_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'user_roles' 
               AND constraint_name = 'user_roles_user_id_fkey') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_user_id_fkey;
    END IF;
    
    -- Add the correct foreign key constraints
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_role_slug_fkey 
    FOREIGN KEY (role_slug) REFERENCES public.roles(slug) ON DELETE CASCADE;
    
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraints already exist
        NULL;
END $$;

-- Ensure the user_roles table has the correct structure
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'id') THEN
        ALTER TABLE public.user_roles ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'user_id') THEN
        ALTER TABLE public.user_roles ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'role_slug') THEN
        ALTER TABLE public.user_roles ADD COLUMN role_slug TEXT REFERENCES public.roles(slug) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'created_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.user_roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Make sure the primary key is set correctly
DO $$ 
BEGIN
    -- Drop existing primary key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'user_roles' 
               AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_pkey;
    END IF;
    
    -- Add the correct primary key
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraint already exists
        NULL;
END $$;

-- Add unique constraint for user_id and role_slug combination
DO $$ 
BEGIN
    ALTER TABLE public.user_roles 
    ADD CONSTRAINT user_roles_user_id_role_slug_unique 
    UNIQUE (user_id, role_slug);
EXCEPTION
    WHEN duplicate_table THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_slug ON public.user_roles(role_slug);

-- Update the RLS policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Super admins can manage all user roles" ON public.user_roles;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

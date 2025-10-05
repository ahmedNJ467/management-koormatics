-- Fix roles table and ensure proper data
-- This migration ensures the roles table has the correct structure and data

-- First, let's make sure the roles table has the correct structure
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'roles' AND column_name = 'id') THEN
        ALTER TABLE public.roles ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'roles' AND column_name = 'slug') THEN
        ALTER TABLE public.roles ADD COLUMN slug TEXT UNIQUE NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'roles' AND column_name = 'name') THEN
        ALTER TABLE public.roles ADD COLUMN name TEXT NOT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'roles' AND column_name = 'description') THEN
        ALTER TABLE public.roles ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'roles' AND column_name = 'created_at') THEN
        ALTER TABLE public.roles ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'roles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.roles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Make sure the primary key is set correctly
DO $$ 
BEGIN
    -- Drop existing primary key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'roles' 
               AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE public.roles DROP CONSTRAINT roles_pkey;
    END IF;
    
    -- Add the correct primary key
    ALTER TABLE public.roles ADD CONSTRAINT roles_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraint already exists
        NULL;
END $$;

-- Insert default roles if they don't exist
INSERT INTO public.roles (slug, name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full system access and control'),
  ('fleet_manager', 'Fleet Manager', 'Manage vehicles, drivers, and fleet operations'),
  ('operations_manager', 'Operations Manager', 'Manage trips, clients, and daily operations'),
  ('finance_manager', 'Finance Manager', 'Manage invoices, payments, and financial records')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = now();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles(slug);
CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);

-- Update the RLS policy
DROP POLICY IF EXISTS "Authenticated users can view roles" ON public.roles;
CREATE POLICY "Authenticated users can view roles" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

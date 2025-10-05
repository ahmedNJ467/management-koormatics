-- Fix alerts table structure
-- This migration ensures the alerts table has the correct structure

-- Check if alerts table exists and has the right structure
DO $$ 
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'id') THEN
        ALTER TABLE public.alerts ADD COLUMN id UUID DEFAULT gen_random_uuid();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'title') THEN
        ALTER TABLE public.alerts ADD COLUMN title TEXT NOT NULL DEFAULT 'Alert';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'message') THEN
        ALTER TABLE public.alerts ADD COLUMN message TEXT NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'type') THEN
        ALTER TABLE public.alerts ADD COLUMN type TEXT NOT NULL DEFAULT 'info';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'resolved') THEN
        ALTER TABLE public.alerts ADD COLUMN resolved BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'date') THEN
        ALTER TABLE public.alerts ADD COLUMN date TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'created_at') THEN
        ALTER TABLE public.alerts ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'alerts' AND column_name = 'updated_at') THEN
        ALTER TABLE public.alerts ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Make sure the primary key is set correctly
DO $$ 
BEGIN
    -- Drop existing primary key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'alerts' 
               AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE public.alerts DROP CONSTRAINT alerts_pkey;
    END IF;
    
    -- Add the correct primary key
    ALTER TABLE public.alerts ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraint already exists
        NULL;
END $$;

-- Add constraints for type column (skip if exists)
DO $$ 
BEGIN
    ALTER TABLE public.alerts 
    ADD CONSTRAINT alerts_type_check 
    CHECK (type IN ('info', 'warning', 'error', 'success'));
EXCEPTION
    WHEN duplicate_object THEN
        -- Constraint already exists, ignore
        NULL;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_date ON public.alerts(date);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);

-- Update the RLS policy
DROP POLICY IF EXISTS "Authenticated users can view alerts" ON public.alerts;
DROP POLICY IF EXISTS "Super admins can manage alerts" ON public.alerts;

CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage alerts" ON public.alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

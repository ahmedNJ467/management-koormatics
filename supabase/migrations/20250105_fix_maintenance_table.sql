-- Fix maintenance table structure
-- This migration adds missing columns to the maintenance table

-- First, let's check what columns exist and add missing ones
ALTER TABLE public.maintenance 
ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS date TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS cost DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS service_provider TEXT,
ADD COLUMN IF NOT EXISTS next_service_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Make sure the primary key is set correctly
DO $$ 
BEGIN
    -- Drop existing primary key if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE table_name = 'maintenance' 
               AND constraint_type = 'PRIMARY KEY') THEN
        ALTER TABLE public.maintenance DROP CONSTRAINT maintenance_pkey;
    END IF;
    
    -- Add the correct primary key
    ALTER TABLE public.maintenance ADD CONSTRAINT maintenance_pkey PRIMARY KEY (id);
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if constraint already exists
        NULL;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_type ON public.maintenance(maintenance_type);

-- Update the RLS policy to be more specific
DROP POLICY IF EXISTS "Authenticated users can manage maintenance" ON public.maintenance;
CREATE POLICY "Authenticated users can manage maintenance" ON public.maintenance
  FOR ALL USING (auth.role() = 'authenticated');

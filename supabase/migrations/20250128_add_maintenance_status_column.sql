-- Add status column to maintenance table
-- This migration adds the missing status column that the application expects

-- First, create the maintenance_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
        CREATE TYPE maintenance_status AS ENUM (
            'scheduled',
            'in_progress', 
            'completed',
            'cancelled'
        );
    END IF;
END $$;

-- Add the status column to the maintenance table
ALTER TABLE public.maintenance 
ADD COLUMN IF NOT EXISTS status maintenance_status DEFAULT 'scheduled';

-- Add an index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);

-- Update any existing records to have a default status
UPDATE public.maintenance 
SET status = 'completed' 
WHERE status IS NULL;

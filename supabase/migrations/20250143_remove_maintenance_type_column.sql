-- Remove maintenance_type column from maintenance table
-- This migration drops the maintenance_type column as it's no longer needed

-- Drop the index if it exists
DROP INDEX IF EXISTS public.idx_maintenance_type;

-- Drop the maintenance_type column
ALTER TABLE public.maintenance 
DROP COLUMN IF EXISTS maintenance_type;


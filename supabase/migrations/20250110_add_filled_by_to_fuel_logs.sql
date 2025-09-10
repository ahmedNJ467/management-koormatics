-- Add filled_by column to fuel_logs table if it doesn't exist
-- This migration ensures the filled_by column is present for fuel log tracking

-- Add the filled_by column if it doesn't exist
ALTER TABLE public.fuel_logs 
ADD COLUMN IF NOT EXISTS filled_by TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.fuel_logs.filled_by IS 'Name of the person who filled the fuel';

-- Create an index on filled_by for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_fuel_logs_filled_by ON public.fuel_logs(filled_by);

-- Update any existing records to have a default value if needed (optional)
-- UPDATE public.fuel_logs SET filled_by = 'Unknown' WHERE filled_by IS NULL;

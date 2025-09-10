-- SQL Script to add filled_by column to fuel_logs table
-- Run this in your Supabase SQL Editor

-- Add the filled_by column if it doesn't exist
ALTER TABLE public.fuel_logs 
ADD COLUMN IF NOT EXISTS filled_by TEXT;

-- Add a comment to document the column purpose
COMMENT ON COLUMN public.fuel_logs.filled_by IS 'Name of the person who filled the fuel';

-- Create an index on filled_by for better query performance (optional)
CREATE INDEX IF NOT EXISTS idx_fuel_logs_filled_by ON public.fuel_logs(filled_by);

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'fuel_logs' 
AND column_name = 'filled_by';

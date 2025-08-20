-- Add filled_by column to fuel_logs table
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS filled_by TEXT; 
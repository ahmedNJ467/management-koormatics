-- Add cost tracking fields to tank_fills table
ALTER TABLE public.tank_fills 
ADD COLUMN IF NOT EXISTS cost_per_liter NUMERIC,
ADD COLUMN IF NOT EXISTS total_cost NUMERIC;
 
-- Update existing records to have zero costs if they don't have values
UPDATE public.tank_fills 
SET cost_per_liter = 0, total_cost = 0 
WHERE cost_per_liter IS NULL OR total_cost IS NULL; 
-- Add price_per_liter column to fuel_logs table
ALTER TABLE public.fuel_logs 
ADD COLUMN IF NOT EXISTS price_per_liter NUMERIC;

-- Update existing records to calculate price_per_liter from cost and volume
UPDATE public.fuel_logs 
SET price_per_liter = CASE 
  WHEN volume > 0 THEN cost / volume 
  ELSE 0 
END
WHERE price_per_liter IS NULL AND volume > 0;

-- Set price_per_liter to 0 for records where volume is 0 or null
UPDATE public.fuel_logs 
SET price_per_liter = 0 
WHERE price_per_liter IS NULL; 

-- Add missing columns to quotations table
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS vat_percentage numeric,
ADD COLUMN IF NOT EXISTS discount_percentage numeric;

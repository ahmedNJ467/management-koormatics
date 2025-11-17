-- Add location column to drivers table
ALTER TABLE public.drivers
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.drivers.location IS 'Driver location (e.g., Nairobi Yard A)';


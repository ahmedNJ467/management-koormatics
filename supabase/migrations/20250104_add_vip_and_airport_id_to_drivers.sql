-- Add VIP driver and Airport ID card fields to drivers table
-- Migration: 20250104_add_vip_and_airport_id_to_drivers

-- Add is_vip boolean field with default false
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;

-- Add airport_id_url text field for storing airport ID card file URLs
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS airport_id_url TEXT;

-- Create index on is_vip for better query performance
CREATE INDEX IF NOT EXISTS idx_drivers_is_vip ON drivers(is_vip);

-- Add comment to document the new fields
COMMENT ON COLUMN drivers.is_vip IS 'Indicates if the driver is a VIP driver';
COMMENT ON COLUMN drivers.airport_id_url IS 'URL to the uploaded airport ID card document';

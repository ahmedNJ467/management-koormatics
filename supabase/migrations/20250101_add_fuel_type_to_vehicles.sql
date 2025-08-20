-- First, extend the fuel_type enum to include hybrid and electric
ALTER TYPE fuel_type ADD VALUE IF NOT EXISTS 'hybrid';
ALTER TYPE fuel_type ADD VALUE IF NOT EXISTS 'electric';

-- Add fuel_type column to vehicles table
ALTER TABLE vehicles 
ADD COLUMN fuel_type fuel_type;

-- Set default fuel_type for existing vehicles
UPDATE vehicles 
SET fuel_type = 'petrol' 
WHERE fuel_type IS NULL; 
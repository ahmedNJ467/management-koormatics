-- Make driver license fields nullable to allow optional license information
-- This migration removes the NOT NULL constraint from license_number
-- and ensures license_type and license_expiry can be null

-- =====================================================
-- 1. DROP UNIQUE CONSTRAINT IF IT EXISTS
-- =====================================================
-- We need to drop the unique constraint before modifying the column
DO $$
BEGIN
    -- Drop unique constraint on license_number if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'drivers_license_number_key' 
        AND table_name = 'drivers'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.drivers DROP CONSTRAINT drivers_license_number_key;
    END IF;
END $$;

-- =====================================================
-- 2. ALTER LICENSE_NUMBER TO ALLOW NULL
-- =====================================================
ALTER TABLE public.drivers 
ALTER COLUMN license_number DROP NOT NULL;

-- =====================================================
-- 3. ENSURE LICENSE_TYPE AND LICENSE_EXPIRY CAN BE NULL
-- =====================================================
-- These should already be nullable, but we'll ensure they are
ALTER TABLE public.drivers 
ALTER COLUMN license_type DROP NOT NULL;

ALTER TABLE public.drivers 
ALTER COLUMN license_expiry DROP NOT NULL;

-- =====================================================
-- 4. RECREATE UNIQUE CONSTRAINT (ALLOWING NULL)
-- =====================================================
-- Create a unique partial index that allows multiple NULLs
-- This ensures uniqueness when license_number is provided, but allows multiple NULLs
CREATE UNIQUE INDEX IF NOT EXISTS drivers_license_number_unique 
ON public.drivers(license_number) 
WHERE license_number IS NOT NULL;

-- =====================================================
-- 5. UPDATE EXISTING NULL/EMPTY VALUES
-- =====================================================
-- Convert any empty strings to NULL for consistency
UPDATE public.drivers 
SET license_number = NULL 
WHERE license_number = '' OR license_number IS NULL;

UPDATE public.drivers 
SET license_type = NULL 
WHERE license_type = '' OR license_type IS NULL;

UPDATE public.drivers 
SET license_expiry = NULL 
WHERE license_expiry IS NULL;

-- =====================================================
-- 6. ADD COMMENTS
-- =====================================================
COMMENT ON COLUMN public.drivers.license_number IS 'Driver license number (optional, unique when provided)';
COMMENT ON COLUMN public.drivers.license_type IS 'Type of driver license (optional)';
COMMENT ON COLUMN public.drivers.license_expiry IS 'License expiration date (optional)';


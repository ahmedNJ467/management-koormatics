-- Clean up duplicate entries in fuel_management table
-- This migration removes duplicates and ensures only unique fuel types exist

-- =====================================================
-- 1. REMOVE DUPLICATE ENTRIES
-- =====================================================

-- Remove duplicate entries, keeping only the first occurrence of each unique fuel_type
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY fuel_type ORDER BY created_at) as rn
  FROM public.fuel_management
)
DELETE FROM public.fuel_management 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- =====================================================
-- 2. ENSURE UNIQUE CONSTRAINTS
-- =====================================================

-- Add unique constraint on fuel_type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fuel_management_fuel_type_unique'
    ) THEN
        ALTER TABLE public.fuel_management 
        ADD CONSTRAINT fuel_management_fuel_type_unique 
        UNIQUE (fuel_type);
    END IF;
END $$;

-- =====================================================
-- 3. INSERT CLEAN DEFAULT DATA
-- =====================================================

-- Clear existing data and insert only the two required fuel types
TRUNCATE TABLE public.fuel_management RESTART IDENTITY CASCADE;

-- Insert only the two required fuel management entries
INSERT INTO public.fuel_management (name, fuel_type) VALUES
  ('Main Petrol Tank', 'petrol'),
  ('Main Diesel Tank', 'diesel');

-- =====================================================
-- 4. UPDATE FUEL_LOGS TO HANDLE NULL REFERENCES
-- =====================================================

-- Update any fuel_logs that reference deleted fuel_management entries
-- Set fuel_management_id to NULL for any references to deleted entries
UPDATE public.fuel_logs 
SET fuel_management_id = NULL 
WHERE fuel_management_id NOT IN (
  SELECT id FROM public.fuel_management
);

-- =====================================================
-- 5. VERIFY CLEANUP
-- =====================================================

-- Verify that only two entries exist
SELECT 
  id,
  name,
  fuel_type,
  created_at
FROM public.fuel_management 
ORDER BY fuel_type;

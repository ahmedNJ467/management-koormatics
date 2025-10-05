-- Fix duplicate entries in fuel_management table
-- This migration removes duplicates and ensures unique entries

-- =====================================================
-- 1. REMOVE DUPLICATE ENTRIES
-- =====================================================

-- Remove duplicate entries, keeping only the first occurrence of each unique combination
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY name, fuel_type ORDER BY created_at) as rn
  FROM public.fuel_management
)
DELETE FROM public.fuel_management 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- =====================================================
-- 2. ENSURE UNIQUE CONSTRAINTS
-- =====================================================

-- Add unique constraint to prevent future duplicates (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fuel_management_name_fuel_type_unique'
    ) THEN
        ALTER TABLE public.fuel_management 
        ADD CONSTRAINT fuel_management_name_fuel_type_unique 
        UNIQUE (name, fuel_type);
    END IF;
END $$;

-- =====================================================
-- 3. INSERT CLEAN DEFAULT DATA
-- =====================================================

-- Clear existing data and insert clean default entries
TRUNCATE TABLE public.fuel_management RESTART IDENTITY CASCADE;

-- Insert unique default fuel management entries
INSERT INTO public.fuel_management (name, fuel_type) VALUES
  ('Main Petrol Tank', 'petrol'),
  ('Main Diesel Tank', 'diesel'),
  ('Reserve Petrol Tank', 'petrol'),
  ('Reserve Diesel Tank', 'diesel'),
  ('Emergency Fuel Storage', 'petrol'),
  ('Backup Diesel Storage', 'diesel');

-- =====================================================
-- 4. UPDATE FUEL_LOGS TO HANDLE NULL REFERENCES
-- =====================================================

-- Update any fuel_logs that reference deleted fuel_management entries
UPDATE public.fuel_logs 
SET fuel_management_id = NULL 
WHERE fuel_management_id NOT IN (SELECT id FROM public.fuel_management);

-- =====================================================
-- 5. VERIFY CLEANUP
-- =====================================================

-- Check that duplicates are removed and data is clean
DO $$
DECLARE
  total_count INTEGER;
  unique_count INTEGER;
  duplicate_count INTEGER;
BEGIN
  -- Count total entries
  SELECT COUNT(*) INTO total_count FROM public.fuel_management;
  
  -- Count unique combinations
  SELECT COUNT(DISTINCT name || '|' || fuel_type) INTO unique_count FROM public.fuel_management;
  
  -- Calculate duplicates
  duplicate_count := total_count - unique_count;
  
  RAISE NOTICE 'Fuel Management Cleanup Status:';
  RAISE NOTICE '  Total entries: %', total_count;
  RAISE NOTICE '  Unique combinations: %', unique_count;
  RAISE NOTICE '  Duplicates found: %', duplicate_count;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '✅ Duplicates removed successfully!';
  ELSE
    RAISE NOTICE '❌ Some duplicates may still exist.';
  END IF;
END $$;

-- Simplify fuel management to have only one petrol and one diesel entry
-- This migration removes all entries and creates only the essential ones

-- =====================================================
-- 1. CLEAR ALL EXISTING DATA
-- =====================================================

-- Remove all existing fuel management entries
TRUNCATE TABLE public.fuel_management RESTART IDENTITY CASCADE;

-- =====================================================
-- 2. INSERT ONLY ESSENTIAL ENTRIES
-- =====================================================

-- Insert only one petrol and one diesel entry
INSERT INTO public.fuel_management (name, fuel_type) VALUES
  ('Petrol Tank', 'petrol'),
  ('Diesel Tank', 'diesel');

-- =====================================================
-- 3. VERIFY SIMPLIFICATION
-- =====================================================

-- Check that we have exactly 2 entries
DO $$
DECLARE
  total_count INTEGER;
  petrol_count INTEGER;
  diesel_count INTEGER;
BEGIN
  -- Count total entries
  SELECT COUNT(*) INTO total_count FROM public.fuel_management;
  
  -- Count petrol entries
  SELECT COUNT(*) INTO petrol_count FROM public.fuel_management WHERE fuel_type = 'petrol';
  
  -- Count diesel entries
  SELECT COUNT(*) INTO diesel_count FROM public.fuel_management WHERE fuel_type = 'diesel';
  
  RAISE NOTICE 'Fuel Management Simplification Status:';
  RAISE NOTICE '  Total entries: %', total_count;
  RAISE NOTICE '  Petrol entries: %', petrol_count;
  RAISE NOTICE '  Diesel entries: %', diesel_count;
  
  IF total_count = 2 AND petrol_count = 1 AND diesel_count = 1 THEN
    RAISE NOTICE '✅ Fuel management simplified successfully!';
    RAISE NOTICE 'Now you have exactly one petrol and one diesel entry.';
  ELSE
    RAISE NOTICE '❌ Fuel management simplification incomplete.';
  END IF;
END $$;

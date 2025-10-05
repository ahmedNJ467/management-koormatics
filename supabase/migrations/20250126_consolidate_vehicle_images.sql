-- Consolidate vehicle images into vehicles table
-- This migration adds an images column to vehicles table and migrates data from vehicle_images table

-- =====================================================
-- 1. ADD IMAGES COLUMN TO VEHICLES TABLE
-- =====================================================

-- Add images column to vehicles table as JSONB array
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- =====================================================
-- 2. MIGRATE EXISTING DATA FROM VEHICLE_IMAGES TABLE
-- =====================================================

-- Migrate existing vehicle_images data to the new images column
UPDATE public.vehicles 
SET images = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', vi.id,
        'url', vi.image_url,
        'created_at', vi.created_at
      )
    )
    FROM public.vehicle_images vi 
    WHERE vi.vehicle_id = vehicles.id
  ),
  '[]'::jsonb
);

-- =====================================================
-- 3. DROP THE VEHICLE_IMAGES TABLE
-- =====================================================

-- Drop the vehicle_images table since we've consolidated the data
DROP TABLE IF EXISTS public.vehicle_images CASCADE;

-- =====================================================
-- 4. UPDATE RLS POLICIES
-- =====================================================

-- Remove any RLS policies that might reference vehicle_images
-- (These will be automatically dropped with the table, but just to be safe)

-- =====================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

-- Add comment to the new images column
COMMENT ON COLUMN public.vehicles.images IS 'Array of vehicle images stored as JSONB objects with id, url, and created_at fields';

-- =====================================================
-- 6. VERIFY MIGRATION
-- =====================================================

-- Verify that all vehicles have the images column
DO $$
DECLARE
  vehicle_count INTEGER;
  vehicles_with_images INTEGER;
BEGIN
  SELECT COUNT(*) INTO vehicle_count FROM public.vehicles;
  SELECT COUNT(*) INTO vehicles_with_images FROM public.vehicles WHERE images IS NOT NULL;
  
  RAISE NOTICE 'Migration completed: % vehicles total, % with images column', vehicle_count, vehicles_with_images;
END $$;

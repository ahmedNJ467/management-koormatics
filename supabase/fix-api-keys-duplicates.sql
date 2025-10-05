-- Fix API keys duplicates - Manual SQL script
-- Run this in your Supabase Dashboard SQL Editor

-- =====================================================
-- 1. CHECK CURRENT STATE
-- =====================================================

-- Check how many entries exist for google_maps
SELECT 
  name,
  COUNT(*) as count,
  array_agg(id) as ids,
  array_agg(created_at) as created_dates
FROM public.api_keys 
WHERE name = 'google_maps'
GROUP BY name;

-- =====================================================
-- 2. REMOVE DUPLICATE ENTRIES
-- =====================================================

-- Remove duplicate entries, keeping only the most recent one
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM public.api_keys
  WHERE name = 'google_maps'
)
DELETE FROM public.api_keys 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- =====================================================
-- 3. ENSURE UNIQUE CONSTRAINT
-- =====================================================

-- Add unique constraint on name field if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'api_keys_name_unique'
    ) THEN
        ALTER TABLE public.api_keys 
        ADD CONSTRAINT api_keys_name_unique 
        UNIQUE (name);
    END IF;
END $$;

-- =====================================================
-- 4. INSERT/UPDATE GOOGLE MAPS API KEY
-- =====================================================

-- Insert or update the Google Maps API key
INSERT INTO public.api_keys (
  name,
  key_value,
  permissions,
  is_active,
  expires_at,
  created_at,
  updated_at
) VALUES (
  'google_maps',
  'AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY',
  '["maps", "geocoding", "places", "routing"]'::jsonb,
  true,
  NULL,
  now(),
  now()
) ON CONFLICT (name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();

-- =====================================================
-- 5. VERIFY FIX
-- =====================================================

-- Verify that only one entry exists for google_maps
SELECT 
  name,
  key_value,
  is_active,
  created_at,
  updated_at
FROM public.api_keys 
WHERE name = 'google_maps';

-- Check for any remaining duplicates
SELECT 
  name,
  COUNT(*) as count
FROM public.api_keys 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Final verification
SELECT 'API keys cleanup completed successfully' as status;

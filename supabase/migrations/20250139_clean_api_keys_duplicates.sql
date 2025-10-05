-- Clean up duplicate entries in api_keys table
-- This migration removes duplicates and ensures only unique API keys exist

-- =====================================================
-- 1. REMOVE DUPLICATE ENTRIES
-- =====================================================

-- Remove duplicate entries, keeping only the most recent occurrence of each unique name
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
  FROM public.api_keys
)
DELETE FROM public.api_keys 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- =====================================================
-- 2. ENSURE UNIQUE CONSTRAINTS
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
-- 3. INSERT GOOGLE MAPS API KEY IF NOT EXISTS
-- =====================================================

-- Insert Google Maps API key if it doesn't exist
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
-- 4. VERIFY CLEANUP
-- =====================================================

-- Verify that only one entry exists for each API key
SELECT 
  name,
  is_active,
  created_at,
  updated_at
FROM public.api_keys 
ORDER BY name, created_at DESC;

-- Check for any remaining duplicates
SELECT 
  name,
  COUNT(*) as count
FROM public.api_keys 
GROUP BY name 
HAVING COUNT(*) > 1;

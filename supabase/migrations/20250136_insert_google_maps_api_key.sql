-- Insert Google Maps API key into the api_keys table
-- This migration adds the Google Maps API key to the database for centralized management

-- Insert the Google Maps API key
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
  NULL, -- No expiration date
  now(),
  now()
) ON CONFLICT (name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();

-- Log the insertion
DO $$
BEGIN
  RAISE NOTICE 'Google Maps API key has been inserted/updated in the database';
  RAISE NOTICE 'Key name: google_maps';
  RAISE NOTICE 'Key value: AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY';
  RAISE NOTICE 'Permissions: maps, geocoding, places, routing';
  RAISE NOTICE 'Status: active';
END $$;


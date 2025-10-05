# Manual API Keys Database Setup

Since we're having issues with the automated setup, here's how to manually set up the API keys table in your Supabase dashboard:

## Step 1: Go to Supabase Dashboard

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**

## Step 2: Run the Setup SQL

Copy and paste the following SQL into the SQL Editor and run it:

```sql
-- Create the api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_value TEXT UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add unique constraint on name field
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

-- Enable Row Level Security
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view api keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Users can create api keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Users can update api keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Users can delete api keys" ON public.api_keys;

    -- Create new policies
    CREATE POLICY "Users can view api keys" ON public.api_keys
        FOR SELECT USING (true);

    CREATE POLICY "Users can create api keys" ON public.api_keys
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update api keys" ON public.api_keys
        FOR UPDATE USING (true);

    CREATE POLICY "Users can delete api keys" ON public.api_keys
        FOR DELETE USING (true);
END $$;

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
  NULL,
  now(),
  now()
) ON CONFLICT (name) DO UPDATE SET
  key_value = EXCLUDED.key_value,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active,
  expires_at = EXCLUDED.expires_at,
  updated_at = now();

-- Verify the insertion
SELECT
  name,
  CASE
    WHEN LENGTH(key_value) > 10 THEN LEFT(key_value, 10) || '...'
    ELSE key_value
  END as key_preview,
  permissions,
  is_active,
  created_at
FROM public.api_keys
WHERE name = 'google_maps';
```

## Step 3: Verify Setup

After running the SQL, you should see:

- ✅ Table created successfully
- ✅ Unique constraint added
- ✅ RLS policies created
- ✅ Google Maps API key inserted
- ✅ Verification query shows the inserted key

## Step 4: Test the Application

Once the database setup is complete, your application will automatically:

1. Load the Google Maps API key from the database
2. Fall back to environment variables if database is unavailable
3. Use the hardcoded key as final fallback

## Alternative: Environment Variable Only

If you prefer to skip the database setup for now, the application will work with just the environment variable:

- Set `NEXT_PUBLIC_GOOGLE_MAPS_KEY=AIzaSyB6wCOi9B8kcTLiwrE7KjV93882exWNKAY` in your `.env.local` file

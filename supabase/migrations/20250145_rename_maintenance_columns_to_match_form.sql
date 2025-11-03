-- Rename maintenance table columns to exactly match form field names
-- Form fields: vehicle_id, date, description, expense, status, next_scheduled, notes, service_provider

-- Step 1: Remove maintenance_type column if it exists
DROP INDEX IF EXISTS public.idx_maintenance_type;
ALTER TABLE public.maintenance DROP COLUMN IF EXISTS maintenance_type;

-- Step 2: Rename cost to expense (form field name)
ALTER TABLE public.maintenance RENAME COLUMN cost TO expense;

-- Step 3: Rename next_service_date to next_scheduled (form field name)
ALTER TABLE public.maintenance RENAME COLUMN next_service_date TO next_scheduled;

-- Step 4: Create maintenance_status enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'maintenance_status') THEN
        CREATE TYPE maintenance_status AS ENUM (
            'scheduled',
            'in_progress', 
            'completed',
            'cancelled'
        );
    END IF;
END $$;

-- Step 5: Ensure all columns have correct types and constraints
-- id (UUID, primary key, auto-generated)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'id') THEN
        ALTER TABLE public.maintenance ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    ELSE
        ALTER TABLE public.maintenance ALTER COLUMN id SET DEFAULT gen_random_uuid();
    END IF;
END $$;

-- vehicle_id (UUID, foreign key, required) - form field: "vehicle_id"
ALTER TABLE public.maintenance 
  ALTER COLUMN vehicle_id SET NOT NULL;

-- date (TIMESTAMPTZ, required) - form field: "date"
ALTER TABLE public.maintenance 
  ALTER COLUMN date TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN date IS NULL THEN now()
      ELSE date::TIMESTAMPTZ 
    END,
  ALTER COLUMN date SET NOT NULL;

-- description (TEXT, required) - form field: "description"
ALTER TABLE public.maintenance 
  ALTER COLUMN description TYPE TEXT,
  ALTER COLUMN description SET NOT NULL;

-- expense (DECIMAL, required) - form field: "expense" (renamed from cost)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'expense') THEN
        ALTER TABLE public.maintenance ADD COLUMN expense DECIMAL(10,2) NOT NULL DEFAULT 0;
    ELSE
        ALTER TABLE public.maintenance 
          ALTER COLUMN expense TYPE DECIMAL(10,2),
          ALTER COLUMN expense SET DEFAULT 0,
          ALTER COLUMN expense SET NOT NULL;
    END IF;
END $$;

-- status (maintenance_status enum, required) - form field: "status"
ALTER TABLE public.maintenance 
  ALTER COLUMN status TYPE maintenance_status USING status::maintenance_status,
  ALTER COLUMN status SET DEFAULT 'scheduled',
  ALTER COLUMN status SET NOT NULL;

-- next_scheduled (TIMESTAMPTZ, optional) - form field: "next_scheduled" (renamed from next_service_date)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'next_scheduled') THEN
        ALTER TABLE public.maintenance ADD COLUMN next_scheduled TIMESTAMPTZ;
    ELSE
        ALTER TABLE public.maintenance 
          ALTER COLUMN next_scheduled TYPE TIMESTAMPTZ USING next_scheduled::TIMESTAMPTZ;
    END IF;
END $$;

-- notes (TEXT, optional) - form field: "notes"
ALTER TABLE public.maintenance 
  ALTER COLUMN notes TYPE TEXT;

-- service_provider (TEXT, optional) - form field: "service_provider"
ALTER TABLE public.maintenance 
  ALTER COLUMN service_provider TYPE TEXT;

-- created_at (TIMESTAMPTZ, auto-generated)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.maintenance ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    ELSE
        ALTER TABLE public.maintenance ALTER COLUMN created_at SET DEFAULT now();
    END IF;
END $$;

-- updated_at (TIMESTAMPTZ, auto-generated)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.maintenance ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    ELSE
        ALTER TABLE public.maintenance ALTER COLUMN updated_at SET DEFAULT now();
    END IF;
END $$;

-- Step 6: Update indexes (drop old ones and create new ones with correct column names)
DROP INDEX IF EXISTS public.idx_maintenance_expense;
DROP INDEX IF EXISTS public.idx_maintenance_next_scheduled;
DROP INDEX IF EXISTS public.idx_maintenance_type;

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_scheduled ON public.maintenance(next_scheduled) WHERE next_scheduled IS NOT NULL;

-- Step 7: Enable RLS if not already enabled
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Step 8: Ensure RLS policy exists
DROP POLICY IF EXISTS "Authenticated users can manage maintenance" ON public.maintenance;
CREATE POLICY "Authenticated users can manage maintenance" ON public.maintenance
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 9: Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_maintenance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintenance_updated_at_trigger ON public.maintenance;
CREATE TRIGGER maintenance_updated_at_trigger
  BEFORE UPDATE ON public.maintenance
  FOR EACH ROW
  EXECUTE FUNCTION update_maintenance_updated_at();


-- Fix maintenance table to match form fields exactly
-- Rename date_performed to date and ensure all columns match form field names

-- Step 1: Rename date_performed to date if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'date_performed') THEN
        ALTER TABLE public.maintenance RENAME COLUMN date_performed TO date;
    END IF;
END $$;

-- Step 2: Remove maintenance_type column if it exists
DROP INDEX IF EXISTS public.idx_maintenance_type;
ALTER TABLE public.maintenance DROP COLUMN IF EXISTS maintenance_type;

-- Step 3: Rename cost to expense if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'cost') THEN
        ALTER TABLE public.maintenance RENAME COLUMN cost TO expense;
    END IF;
END $$;

-- Step 4: Rename next_service_date to next_scheduled if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'next_service_date') THEN
        ALTER TABLE public.maintenance RENAME COLUMN next_service_date TO next_scheduled;
    END IF;
END $$;

-- Step 5: Rename next_due_date to next_scheduled if it exists (alternative column name)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'next_due_date'
               AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_schema = 'public' 
                               AND table_name = 'maintenance' 
                               AND column_name = 'next_scheduled')) THEN
        ALTER TABLE public.maintenance RENAME COLUMN next_due_date TO next_scheduled;
    END IF;
END $$;

-- Step 6: Ensure maintenance_status enum exists
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

-- Step 7: Ensure all required columns exist with correct types
-- Ensure date column exists (TIMESTAMPTZ, required)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'date') THEN
        ALTER TABLE public.maintenance ADD COLUMN date TIMESTAMPTZ NOT NULL DEFAULT now();
    ELSE
        ALTER TABLE public.maintenance 
          ALTER COLUMN date TYPE TIMESTAMPTZ USING 
            CASE 
              WHEN date IS NULL THEN now()
              ELSE date::TIMESTAMPTZ 
            END,
          ALTER COLUMN date SET NOT NULL,
          ALTER COLUMN date SET DEFAULT now();
    END IF;
END $$;

-- Ensure expense column exists (DECIMAL, required)
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

-- Ensure next_scheduled column exists (TIMESTAMPTZ, optional)
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

-- Update all column constraints
ALTER TABLE public.maintenance 
  ALTER COLUMN vehicle_id SET NOT NULL,
  ALTER COLUMN description TYPE TEXT,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN status TYPE maintenance_status USING 
    CASE 
      WHEN status::text IS NULL THEN 'scheduled'::maintenance_status
      ELSE status::maintenance_status 
    END,
  ALTER COLUMN status SET DEFAULT 'scheduled',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN notes TYPE TEXT,
  ALTER COLUMN service_provider TYPE TEXT;

-- Ensure created_at and updated_at exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'created_at') THEN
        ALTER TABLE public.maintenance ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.maintenance ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Step 8: Update indexes
DROP INDEX IF EXISTS public.idx_maintenance_type;
DROP INDEX IF EXISTS public.idx_maintenance_date_performed;
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_scheduled ON public.maintenance(next_scheduled) WHERE next_scheduled IS NOT NULL;

-- Step 9: Enable RLS
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Step 10: Ensure RLS policy exists
DROP POLICY IF EXISTS "Authenticated users can manage maintenance" ON public.maintenance;
CREATE POLICY "Authenticated users can manage maintenance" ON public.maintenance
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 11: Add trigger to auto-update updated_at timestamp
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


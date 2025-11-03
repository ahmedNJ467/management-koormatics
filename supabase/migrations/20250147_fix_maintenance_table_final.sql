-- Final fix for maintenance table to match form fields exactly
-- Handles case where columns may already exist with different names

-- Step 1: If date_performed exists and date doesn't, rename it
-- If both exist, copy data from date_performed to date and drop date_performed
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'date_performed')
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'date') THEN
        -- Both exist: copy data and drop date_performed
        UPDATE public.maintenance 
        SET date = date_performed 
        WHERE date IS NULL AND date_performed IS NOT NULL;
        
        ALTER TABLE public.maintenance DROP COLUMN date_performed;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'maintenance' 
                  AND column_name = 'date_performed')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'maintenance' 
                          AND column_name = 'date') THEN
        -- Only date_performed exists: rename it
        ALTER TABLE public.maintenance RENAME COLUMN date_performed TO date;
    END IF;
END $$;

-- Step 2: Remove maintenance_type column
DROP INDEX IF EXISTS public.idx_maintenance_type;
ALTER TABLE public.maintenance DROP COLUMN IF EXISTS maintenance_type;

-- Step 3: Handle cost -> expense
-- If both exist, copy data and drop cost
-- If only cost exists, rename it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'cost')
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'expense') THEN
        -- Both exist: copy data and drop cost
        UPDATE public.maintenance 
        SET expense = cost 
        WHERE expense IS NULL OR expense = 0;
        
        ALTER TABLE public.maintenance DROP COLUMN cost;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'maintenance' 
                  AND column_name = 'cost')
          AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                          WHERE table_schema = 'public' 
                          AND table_name = 'maintenance' 
                          AND column_name = 'expense') THEN
        -- Only cost exists: rename it
        ALTER TABLE public.maintenance RENAME COLUMN cost TO expense;
    END IF;
END $$;

-- Step 4: Handle next_service_date / next_due_date -> next_scheduled
DO $$
BEGIN
    -- If next_service_date exists and next_scheduled doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'next_service_date')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'maintenance' 
                       AND column_name = 'next_scheduled') THEN
        ALTER TABLE public.maintenance RENAME COLUMN next_service_date TO next_scheduled;
    END IF;
    
    -- If next_due_date exists and next_scheduled doesn't, rename it
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'next_due_date')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'public' 
                       AND table_name = 'maintenance' 
                       AND column_name = 'next_scheduled') THEN
        ALTER TABLE public.maintenance RENAME COLUMN next_due_date TO next_scheduled;
    END IF;
    
    -- If both next_service_date and next_scheduled exist, merge and drop
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'next_service_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'next_scheduled') THEN
        UPDATE public.maintenance 
        SET next_scheduled = next_service_date 
        WHERE next_scheduled IS NULL AND next_service_date IS NOT NULL;
        
        ALTER TABLE public.maintenance DROP COLUMN next_service_date;
    END IF;
    
    -- If both next_due_date and next_scheduled exist, merge and drop
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'maintenance' 
               AND column_name = 'next_due_date')
       AND EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'next_scheduled') THEN
        UPDATE public.maintenance 
        SET next_scheduled = next_due_date 
        WHERE next_scheduled IS NULL AND next_due_date IS NOT NULL;
        
        ALTER TABLE public.maintenance DROP COLUMN next_due_date;
    END IF;
END $$;

-- Step 5: Create maintenance_status enum if it doesn't exist
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

-- Step 6: Ensure date column has correct type and constraints
ALTER TABLE public.maintenance 
  ALTER COLUMN date TYPE TIMESTAMPTZ USING 
    CASE 
      WHEN date IS NULL THEN now()
      ELSE date::TIMESTAMPTZ 
    END,
  ALTER COLUMN date SET NOT NULL;

-- Step 7: Ensure expense column exists and has correct type
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

-- Step 8: Ensure next_scheduled column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'next_scheduled') THEN
        ALTER TABLE public.maintenance ADD COLUMN next_scheduled TIMESTAMPTZ;
    ELSE
        ALTER TABLE public.maintenance 
          ALTER COLUMN next_scheduled TYPE TIMESTAMPTZ USING 
            CASE 
              WHEN next_scheduled IS NULL THEN NULL
              ELSE next_scheduled::TIMESTAMPTZ 
            END;
    END IF;
END $$;

-- Step 9: Update all column constraints
ALTER TABLE public.maintenance 
  ALTER COLUMN vehicle_id SET NOT NULL,
  ALTER COLUMN description TYPE TEXT,
  ALTER COLUMN description SET NOT NULL,
  ALTER COLUMN status TYPE maintenance_status USING 
    CASE 
      WHEN status::text IS NULL THEN 'scheduled'::maintenance_status
      WHEN status::text = 'scheduled' THEN 'scheduled'::maintenance_status
      WHEN status::text = 'in_progress' THEN 'in_progress'::maintenance_status
      WHEN status::text = 'completed' THEN 'completed'::maintenance_status
      WHEN status::text = 'cancelled' THEN 'cancelled'::maintenance_status
      ELSE 'scheduled'::maintenance_status
    END,
  ALTER COLUMN status SET DEFAULT 'scheduled',
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN notes TYPE TEXT,
  ALTER COLUMN service_provider TYPE TEXT;

-- Step 10: Ensure created_at and updated_at exist
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
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'maintenance' 
                   AND column_name = 'updated_at') THEN
        ALTER TABLE public.maintenance ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    ELSE
        ALTER TABLE public.maintenance ALTER COLUMN updated_at SET DEFAULT now();
    END IF;
END $$;

-- Step 11: Clean up old indexes and create new ones
DROP INDEX IF EXISTS public.idx_maintenance_type;
DROP INDEX IF EXISTS public.idx_maintenance_date_performed;
DROP INDEX IF EXISTS public.idx_maintenance_next_service_date;
DROP INDEX IF EXISTS public.idx_maintenance_next_due_date;

CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_scheduled ON public.maintenance(next_scheduled) WHERE next_scheduled IS NOT NULL;

-- Step 12: Enable RLS
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Step 13: Ensure RLS policy exists
DROP POLICY IF EXISTS "Authenticated users can manage maintenance" ON public.maintenance;
CREATE POLICY "Authenticated users can manage maintenance" ON public.maintenance
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 14: Create/update trigger for updated_at timestamp
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


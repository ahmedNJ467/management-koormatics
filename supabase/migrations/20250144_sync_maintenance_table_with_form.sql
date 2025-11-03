-- Sync maintenance table structure to match the form fields exactly
-- Form fields: vehicle_id, date, description, expense (→ cost), status, 
--              next_scheduled (→ next_service_date), notes, service_provider

-- Step 1: Remove maintenance_type column (if not already removed)
DROP INDEX IF EXISTS public.idx_maintenance_type;
ALTER TABLE public.maintenance DROP COLUMN IF EXISTS maintenance_type;

-- Step 2: Create maintenance_status enum if it doesn't exist
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

-- Step 3: Ensure all required columns exist with correct types
-- id (UUID, primary key)
ALTER TABLE public.maintenance 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- vehicle_id (UUID, foreign key, required)
ALTER TABLE public.maintenance 
  ALTER COLUMN vehicle_id SET NOT NULL;

-- date (TIMESTAMPTZ, required) - form field: "date"
ALTER TABLE public.maintenance 
  ALTER COLUMN date TYPE TIMESTAMPTZ USING date::TIMESTAMPTZ,
  ALTER COLUMN date SET NOT NULL;

-- description (TEXT, required) - form field: "description"
ALTER TABLE public.maintenance 
  ALTER COLUMN description TYPE TEXT,
  ALTER COLUMN description SET NOT NULL;

-- cost (DECIMAL, required) - form field: "expense" maps to "cost"
ALTER TABLE public.maintenance 
  ALTER COLUMN cost TYPE DECIMAL(10,2),
  ALTER COLUMN cost SET DEFAULT 0,
  ALTER COLUMN cost SET NOT NULL;

-- status (maintenance_status enum, required) - form field: "status"
ALTER TABLE public.maintenance 
  ALTER COLUMN status TYPE maintenance_status USING status::maintenance_status,
  ALTER COLUMN status SET DEFAULT 'scheduled',
  ALTER COLUMN status SET NOT NULL;

-- next_service_date (TIMESTAMPTZ, optional) - form field: "next_scheduled" maps to "next_service_date"
ALTER TABLE public.maintenance 
  ALTER COLUMN next_service_date TYPE TIMESTAMPTZ USING next_service_date::TIMESTAMPTZ;

-- notes (TEXT, optional) - form field: "notes"
ALTER TABLE public.maintenance 
  ALTER COLUMN notes TYPE TEXT;

-- service_provider (TEXT, optional) - form field: "service_provider"
ALTER TABLE public.maintenance 
  ALTER COLUMN service_provider TYPE TEXT;

-- created_at (TIMESTAMPTZ, auto-generated)
ALTER TABLE public.maintenance 
  ALTER COLUMN created_at SET DEFAULT now();

-- updated_at (TIMESTAMPTZ, auto-generated)
ALTER TABLE public.maintenance 
  ALTER COLUMN updated_at SET DEFAULT now();

-- Step 4: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_service_date ON public.maintenance(next_service_date) WHERE next_service_date IS NOT NULL;

-- Step 5: Enable RLS if not already enabled
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Step 6: Ensure RLS policy exists
DROP POLICY IF EXISTS "Authenticated users can manage maintenance" ON public.maintenance;
CREATE POLICY "Authenticated users can manage maintenance" ON public.maintenance
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 7: Add trigger to auto-update updated_at timestamp
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


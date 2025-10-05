-- Create trip_assignments table
CREATE TABLE IF NOT EXISTS public.trip_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    assigned_at TIMESTAMPTZ DEFAULT now(),
    driver_rating INTEGER CHECK (driver_rating >= 1 AND driver_rating <= 5),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Ensure unique trip-driver combination
    UNIQUE(trip_id, driver_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trip_assignments_trip_id ON public.trip_assignments(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_driver_id ON public.trip_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_trip_assignments_status ON public.trip_assignments(status);

-- Enable RLS
ALTER TABLE public.trip_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view trip assignments" ON public.trip_assignments;
    DROP POLICY IF EXISTS "Users can create trip assignments" ON public.trip_assignments;
    DROP POLICY IF EXISTS "Users can update trip assignments" ON public.trip_assignments;
    DROP POLICY IF EXISTS "Users can delete trip assignments" ON public.trip_assignments;

    -- Create new policies
    CREATE POLICY "Users can view trip assignments" ON public.trip_assignments
        FOR SELECT USING (true);
        
    CREATE POLICY "Users can create trip assignments" ON public.trip_assignments
        FOR INSERT WITH CHECK (true);
        
    CREATE POLICY "Users can update trip assignments" ON public.trip_assignments
        FOR UPDATE USING (true);
        
    CREATE POLICY "Users can delete trip assignments" ON public.trip_assignments
        FOR DELETE USING (true);
END $$;

-- Add updated_at trigger (function may already exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_trip_assignments_updated_at 
    BEFORE UPDATE ON public.trip_assignments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create interest_points table
CREATE TABLE IF NOT EXISTS public.interest_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('pickup', 'dropoff', 'fuel_station', 'rest_area', 'checkpoint', 'hospital', 'police_station', 'custom')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    icon TEXT DEFAULT 'location_on',
    color TEXT DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interest_points_name ON public.interest_points(name);
CREATE INDEX IF NOT EXISTS idx_interest_points_category ON public.interest_points(category);
CREATE INDEX IF NOT EXISTS idx_interest_points_is_active ON public.interest_points(is_active);
CREATE INDEX IF NOT EXISTS idx_interest_points_created_by ON public.interest_points(created_by);
CREATE INDEX IF NOT EXISTS idx_interest_points_location ON public.interest_points(latitude, longitude);

-- Enable RLS
ALTER TABLE public.interest_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view interest points" ON public.interest_points;
    DROP POLICY IF EXISTS "Users can create interest points" ON public.interest_points;
    DROP POLICY IF EXISTS "Users can update interest points" ON public.interest_points;
    DROP POLICY IF EXISTS "Users can delete interest points" ON public.interest_points;

    -- Create new policies
    CREATE POLICY "Users can view interest points" ON public.interest_points
        FOR SELECT USING (true);
        
    CREATE POLICY "Users can create interest points" ON public.interest_points
        FOR INSERT WITH CHECK (true);
        
    CREATE POLICY "Users can update interest points" ON public.interest_points
        FOR UPDATE USING (true);
        
    CREATE POLICY "Users can delete interest points" ON public.interest_points
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

CREATE TRIGGER update_interest_points_updated_at 
    BEFORE UPDATE ON public.interest_points 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

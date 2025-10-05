-- Create escort_teams table
CREATE TABLE IF NOT EXISTS public.escort_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_name TEXT NOT NULL,
    description TEXT,
    guard_ids TEXT[] DEFAULT '{}',
    vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_escort_teams_team_name ON public.escort_teams(team_name);
CREATE INDEX IF NOT EXISTS idx_escort_teams_vehicle_id ON public.escort_teams(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_escort_teams_is_active ON public.escort_teams(is_active);
CREATE INDEX IF NOT EXISTS idx_escort_teams_created_by ON public.escort_teams(created_by);

-- Enable RLS
ALTER TABLE public.escort_teams ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view escort teams" ON public.escort_teams;
    DROP POLICY IF EXISTS "Users can create escort teams" ON public.escort_teams;
    DROP POLICY IF EXISTS "Users can update escort teams" ON public.escort_teams;
    DROP POLICY IF EXISTS "Users can delete escort teams" ON public.escort_teams;

    -- Create new policies
    CREATE POLICY "Users can view escort teams" ON public.escort_teams
        FOR SELECT USING (true);
        
    CREATE POLICY "Users can create escort teams" ON public.escort_teams
        FOR INSERT WITH CHECK (true);
        
    CREATE POLICY "Users can update escort teams" ON public.escort_teams
        FOR UPDATE USING (true);
        
    CREATE POLICY "Users can delete escort teams" ON public.escort_teams
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

CREATE TRIGGER update_escort_teams_updated_at 
    BEFORE UPDATE ON public.escort_teams 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

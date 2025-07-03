-- ====================================================================
-- INSTRUCTIONS: Copy and paste these commands into your Supabase SQL Editor
-- ====================================================================

-- Step 1: Create enum types for inspection fields
CREATE TYPE inspection_status AS ENUM ('pass', 'fail', 'conditional');
CREATE TYPE fluid_level AS ENUM ('good', 'low', 'needs_change', 'needs_refill');
CREATE TYPE condition_status AS ENUM ('good', 'fair', 'poor');

-- Step 2: Create vehicle_inspections table
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    inspector_name TEXT NOT NULL,
    inspection_date DATE NOT NULL,
    pre_trip BOOLEAN DEFAULT false,
    post_trip BOOLEAN DEFAULT false,
    overall_status inspection_status DEFAULT 'pass',
    
    -- Vehicle readings
    mileage INTEGER DEFAULT 0,
    fuel_level INTEGER DEFAULT 100 CHECK (fuel_level >= 0 AND fuel_level <= 100),
    
    -- Fluid levels
    engine_oil fluid_level DEFAULT 'good',
    coolant fluid_level DEFAULT 'good',
    brake_fluid fluid_level DEFAULT 'good',
    
    -- Vehicle condition
    tires_condition condition_status DEFAULT 'good',
    
    -- Safety systems (boolean checks)
    lights_working BOOLEAN DEFAULT true,
    brakes_working BOOLEAN DEFAULT true,
    steering_working BOOLEAN DEFAULT true,
    horn_working BOOLEAN DEFAULT true,
    wipers_working BOOLEAN DEFAULT true,
    mirrors_clean BOOLEAN DEFAULT true,
    seatbelts_working BOOLEAN DEFAULT true,
    
    -- Safety equipment
    first_aid_kit BOOLEAN DEFAULT true,
    fire_extinguisher BOOLEAN DEFAULT true,
    warning_triangle BOOLEAN DEFAULT true,
    jack_spare_tire BOOLEAN DEFAULT true,
    documents_present BOOLEAN DEFAULT true,
    
    -- Cleanliness
    interior_clean BOOLEAN DEFAULT true,
    exterior_clean BOOLEAN DEFAULT true,
    
    -- Notes and observations
    defects_noted TEXT,
    corrective_actions TEXT,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create indexes for better query performance
CREATE INDEX idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX idx_vehicle_inspections_date ON vehicle_inspections(inspection_date);
CREATE INDEX idx_vehicle_inspections_status ON vehicle_inspections(overall_status);
CREATE INDEX idx_vehicle_inspections_inspector ON vehicle_inspections(inspector_name);

-- Step 4: Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_vehicle_inspections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger to automatically update the updated_at field
CREATE TRIGGER trigger_update_vehicle_inspections_updated_at
    BEFORE UPDATE ON vehicle_inspections
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_inspections_updated_at();

-- Step 6: Enable Row Level Security (RLS)
ALTER TABLE vehicle_inspections ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies (adjust based on your authentication setup)
-- For now, allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON vehicle_inspections
    FOR ALL USING (auth.role() = 'authenticated');

-- Step 8: Add comments for documentation
COMMENT ON TABLE vehicle_inspections IS 'Daily vehicle inspection checklists and safety records';
COMMENT ON COLUMN vehicle_inspections.vehicle_id IS 'Reference to the inspected vehicle';
COMMENT ON COLUMN vehicle_inspections.inspector_name IS 'Name of the person conducting the inspection';
COMMENT ON COLUMN vehicle_inspections.inspection_date IS 'Date when the inspection was conducted';
COMMENT ON COLUMN vehicle_inspections.pre_trip IS 'Whether this is a pre-trip inspection';
COMMENT ON COLUMN vehicle_inspections.post_trip IS 'Whether this is a post-trip inspection';
COMMENT ON COLUMN vehicle_inspections.overall_status IS 'Overall inspection result: pass, fail, or conditional';
COMMENT ON COLUMN vehicle_inspections.mileage IS 'Vehicle mileage at time of inspection';
COMMENT ON COLUMN vehicle_inspections.fuel_level IS 'Fuel level percentage (0-100)';
COMMENT ON COLUMN vehicle_inspections.defects_noted IS 'Description of any defects or issues found';
COMMENT ON COLUMN vehicle_inspections.corrective_actions IS 'Required corrective actions to address issues';
COMMENT ON COLUMN vehicle_inspections.notes IS 'Additional observations or comments';

-- ====================================================================
-- VERIFICATION: Run this query to verify the table was created successfully
-- ====================================================================
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns 
WHERE 
    table_name = 'vehicle_inspections' 
ORDER BY 
    ordinal_position;

-- ====================================================================
-- SAMPLE DATA: Optional - Insert a test record to verify everything works
-- ====================================================================
-- Uncomment the lines below to insert sample data:
/*
INSERT INTO vehicle_inspections (
    vehicle_id,
    inspector_name,
    inspection_date,
    pre_trip,
    overall_status,
    mileage,
    fuel_level,
    defects_noted,
    notes
) VALUES (
    (SELECT id FROM vehicles LIMIT 1), -- Uses first vehicle from your vehicles table
    'Test Inspector',
    CURRENT_DATE,
    true,
    'pass',
    50000,
    75,
    'No defects found',
    'Sample inspection record for testing'
);
*/ 
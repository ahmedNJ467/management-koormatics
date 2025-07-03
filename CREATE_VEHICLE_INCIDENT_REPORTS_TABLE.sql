-- Create vehicle incident reports table
-- This table stores detailed information about vehicle incidents, accidents, and insurance claims

-- Create enum types for incident-related fields
DO $$ 
BEGIN
    -- Create incident_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_type') THEN
        CREATE TYPE incident_type AS ENUM (
            'accident',
            'theft', 
            'vandalism',
            'breakdown',
            'traffic_violation',
            'other'
        );
    END IF;

    -- Create incident_severity enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_severity') THEN
        CREATE TYPE incident_severity AS ENUM (
            'minor',
            'moderate',
            'severe',
            'critical'
        );
    END IF;

    -- Create incident_status enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'incident_status') THEN
        CREATE TYPE incident_status AS ENUM (
            'reported',
            'investigating',
            'resolved',
            'closed'
        );
    END IF;
END $$;

-- Create vehicle_incident_reports table
CREATE TABLE IF NOT EXISTS vehicle_incident_reports (
    -- Primary key
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Foreign keys
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    
    -- Incident datetime information
    incident_date DATE NOT NULL,
    incident_time TIME,
    
    -- Incident classification
    incident_type incident_type NOT NULL DEFAULT 'accident',
    severity incident_severity NOT NULL DEFAULT 'minor',
    status incident_status NOT NULL DEFAULT 'reported',
    
    -- Location and description
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Safety and involvement flags
    injuries_reported BOOLEAN NOT NULL DEFAULT FALSE,
    third_party_involved BOOLEAN NOT NULL DEFAULT FALSE,
    photos_attached BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Official report numbers
    police_report_number TEXT,
    insurance_claim_number TEXT,
    
    -- Financial information
    estimated_damage_cost DECIMAL(10,2) CHECK (estimated_damage_cost >= 0),
    actual_repair_cost DECIMAL(10,2) CHECK (actual_repair_cost >= 0),
    
    -- Additional details
    third_party_details TEXT,
    witness_details TEXT,
    
    -- Reporting and follow-up
    reported_by TEXT NOT NULL,
    follow_up_required BOOLEAN NOT NULL DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Additional notes
    notes TEXT,
    
    -- Vehicle damage details (JSON)
    damage_details TEXT,
    
    -- Audit timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_vehicle_id 
    ON vehicle_incident_reports(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_driver_id 
    ON vehicle_incident_reports(driver_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_incident_date 
    ON vehicle_incident_reports(incident_date);

CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_incident_type 
    ON vehicle_incident_reports(incident_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_severity 
    ON vehicle_incident_reports(severity);

CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_status 
    ON vehicle_incident_reports(status);

CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_created_at 
    ON vehicle_incident_reports(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vehicle_incident_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_vehicle_incident_reports_updated_at ON vehicle_incident_reports;
CREATE TRIGGER trigger_update_vehicle_incident_reports_updated_at
    BEFORE UPDATE ON vehicle_incident_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_incident_reports_updated_at();

-- Add Row Level Security (RLS)
ALTER TABLE vehicle_incident_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view incident reports" ON vehicle_incident_reports;
    DROP POLICY IF EXISTS "Users can create incident reports" ON vehicle_incident_reports;
    DROP POLICY IF EXISTS "Users can update incident reports" ON vehicle_incident_reports;
    DROP POLICY IF EXISTS "Users can delete incident reports" ON vehicle_incident_reports;

    -- Create new policies
    CREATE POLICY "Users can view incident reports" ON vehicle_incident_reports
        FOR SELECT USING (true);

    CREATE POLICY "Users can create incident reports" ON vehicle_incident_reports
        FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update incident reports" ON vehicle_incident_reports
        FOR UPDATE USING (true);

    CREATE POLICY "Users can delete incident reports" ON vehicle_incident_reports
        FOR DELETE USING (true);
END $$;

-- Add helpful comments
COMMENT ON TABLE vehicle_incident_reports IS 'Stores detailed information about vehicle incidents, accidents, thefts, breakdowns, and insurance claims';
COMMENT ON COLUMN vehicle_incident_reports.id IS 'Unique identifier for the incident report';
COMMENT ON COLUMN vehicle_incident_reports.vehicle_id IS 'Reference to the vehicle involved in the incident';
COMMENT ON COLUMN vehicle_incident_reports.driver_id IS 'Reference to the driver involved (optional)';
COMMENT ON COLUMN vehicle_incident_reports.incident_date IS 'Date when the incident occurred';
COMMENT ON COLUMN vehicle_incident_reports.incident_time IS 'Time when the incident occurred (optional)';
COMMENT ON COLUMN vehicle_incident_reports.incident_type IS 'Type of incident (accident, theft, vandalism, etc.)';
COMMENT ON COLUMN vehicle_incident_reports.severity IS 'Severity level of the incident';
COMMENT ON COLUMN vehicle_incident_reports.status IS 'Current status of the incident investigation/resolution';
COMMENT ON COLUMN vehicle_incident_reports.location IS 'Location where the incident occurred';
COMMENT ON COLUMN vehicle_incident_reports.description IS 'Detailed description of what happened';
COMMENT ON COLUMN vehicle_incident_reports.injuries_reported IS 'Whether any injuries were reported';
COMMENT ON COLUMN vehicle_incident_reports.third_party_involved IS 'Whether other parties were involved';
COMMENT ON COLUMN vehicle_incident_reports.photos_attached IS 'Whether photos are available for this incident';
COMMENT ON COLUMN vehicle_incident_reports.police_report_number IS 'Official police report number (if applicable)';
COMMENT ON COLUMN vehicle_incident_reports.insurance_claim_number IS 'Insurance claim number (if applicable)';
COMMENT ON COLUMN vehicle_incident_reports.estimated_damage_cost IS 'Initial estimated cost of damages';
COMMENT ON COLUMN vehicle_incident_reports.actual_repair_cost IS 'Final actual cost of repairs';
COMMENT ON COLUMN vehicle_incident_reports.third_party_details IS 'Details about other parties involved';
COMMENT ON COLUMN vehicle_incident_reports.witness_details IS 'Information about witnesses';
COMMENT ON COLUMN vehicle_incident_reports.reported_by IS 'Name of person who reported the incident';
COMMENT ON COLUMN vehicle_incident_reports.follow_up_required IS 'Whether follow-up action is required';
COMMENT ON COLUMN vehicle_incident_reports.follow_up_date IS 'Date for scheduled follow-up';
COMMENT ON COLUMN vehicle_incident_reports.notes IS 'Additional notes and observations';
COMMENT ON COLUMN vehicle_incident_reports.damage_details IS 'JSON data of damaged car parts with severity levels';

-- Insert sample data for demonstration (optional - remove in production)
INSERT INTO vehicle_incident_reports (
    vehicle_id,
    incident_date,
    incident_time,
    incident_type,
    severity,
    status,
    location,
    description,
    injuries_reported,
    third_party_involved,
    photos_attached,
    reported_by,
    follow_up_required,
    estimated_damage_cost
) VALUES (
    (SELECT id FROM vehicles LIMIT 1), -- Use first available vehicle
    CURRENT_DATE - INTERVAL '7 days',
    '14:30:00',
    'accident',
    'moderate',
    'investigating',
    'Main Street & 5th Avenue Intersection',
    'Vehicle was involved in a minor collision at the intersection. The other driver ran a red light and struck the passenger side. No injuries reported but moderate damage to the vehicle body.',
    FALSE,
    TRUE,
    TRUE,
    'Fleet Manager',
    TRUE,
    2500.00
) ON CONFLICT DO NOTHING;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Vehicle incident reports table created successfully!';
    RAISE NOTICE 'Table includes:';
    RAISE NOTICE '- Comprehensive incident tracking';
    RAISE NOTICE '- Financial cost tracking';
    RAISE NOTICE '- Official report number management';
    RAISE NOTICE '- Third party and witness information';
    RAISE NOTICE '- Follow-up scheduling';
    RAISE NOTICE '- Photo and documentation tracking';
    RAISE NOTICE 'Remember to grant appropriate permissions to your application users.';
END $$; 
-- Add dedicated escort vehicle fields to trips table
-- Migration to store escort vehicle assignments separately from notes

-- Add escort vehicle IDs as JSON array
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_vehicle_ids JSONB DEFAULT '[]'::jsonb;

-- Add escort assignment status
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_status TEXT DEFAULT 'not_assigned' CHECK (escort_status IN ('not_assigned', 'partially_assigned', 'fully_assigned'));

-- Add escort assignment timestamp
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_assigned_at TIMESTAMP WITH TIME ZONE;

-- Add index for escort queries
CREATE INDEX IF NOT EXISTS idx_trips_escort_status ON trips(escort_status);
CREATE INDEX IF NOT EXISTS idx_trips_escort_vehicle_ids ON trips USING GIN(escort_vehicle_ids);

-- Add comments for documentation
COMMENT ON COLUMN trips.escort_vehicle_ids IS 'JSON array of vehicle IDs assigned as security escorts';
COMMENT ON COLUMN trips.escort_status IS 'Status of escort assignment: not_assigned, partially_assigned, fully_assigned';
COMMENT ON COLUMN trips.escort_assigned_at IS 'Timestamp when escorts were last assigned';

-- Update existing trips with escort info in notes to extract escort vehicle IDs
-- This is a one-time data migration for existing trips
DO $$
DECLARE
    trip_record RECORD;
    escort_info TEXT;
    vehicle_ids JSONB := '[]'::jsonb;
BEGIN
    FOR trip_record IN 
        SELECT id, notes, has_security_escort, escort_count
        FROM trips 
        WHERE has_security_escort = true AND notes LIKE '%Security Escorts:%'
    LOOP
        -- For now, we'll set status based on whether escorts are mentioned in notes
        IF trip_record.notes LIKE '%Security Escorts:%' THEN
            UPDATE trips 
            SET 
                escort_status = 'fully_assigned',
                escort_assigned_at = NOW()
            WHERE id = trip_record.id;
        END IF;
    END LOOP;
END $$; 
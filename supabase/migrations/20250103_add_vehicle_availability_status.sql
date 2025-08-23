-- Add vehicle availability status for escort assignments
-- Migration to track when vehicles are assigned as escorts

-- Add escort assignment status to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS is_escort_assigned BOOLEAN DEFAULT false;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS escort_trip_id UUID REFERENCES trips(id) ON DELETE SET NULL;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS escort_assigned_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient escort queries
CREATE INDEX IF NOT EXISTS idx_vehicles_escort_assigned ON vehicles(is_escort_assigned);
CREATE INDEX IF NOT EXISTS idx_vehicles_escort_trip_id ON vehicles(escort_trip_id);

-- Add comments for documentation
COMMENT ON COLUMN vehicles.is_escort_assigned IS 'Whether vehicle is currently assigned as security escort';
COMMENT ON COLUMN vehicles.escort_trip_id IS 'Trip ID for which vehicle is assigned as escort';
COMMENT ON COLUMN vehicles.escort_assigned_at IS 'Timestamp when vehicle was assigned as escort';

-- Create function to update vehicle escort status when trip escort assignments change
CREATE OR REPLACE FUNCTION update_vehicle_escort_status()
RETURNS TRIGGER AS $$
DECLARE
    old_vehicle_ids JSONB;
    new_vehicle_ids JSONB;
    vehicle_id TEXT;
BEGIN
    -- Get old and new escort vehicle IDs
    old_vehicle_ids := COALESCE(OLD.escort_vehicle_ids, '[]'::jsonb);
    new_vehicle_ids := COALESCE(NEW.escort_vehicle_ids, '[]'::jsonb);
    
    -- Remove escort assignment from vehicles that are no longer assigned
    IF old_vehicle_ids IS NOT NULL THEN
        FOR vehicle_id IN SELECT jsonb_array_elements_text(old_vehicle_ids)
        LOOP
            IF NOT (new_vehicle_ids ? vehicle_id) THEN
                UPDATE vehicles 
                SET 
                    is_escort_assigned = false,
                    escort_trip_id = NULL,
                    escort_assigned_at = NULL
                WHERE id = vehicle_id::uuid;
            END IF;
        END LOOP;
    END IF;
    
    -- Add escort assignment to newly assigned vehicles
    IF new_vehicle_ids IS NOT NULL THEN
        FOR vehicle_id IN SELECT jsonb_array_elements_text(new_vehicle_ids)
        LOOP
            IF NOT (old_vehicle_ids ? vehicle_id) THEN
                UPDATE vehicles 
                SET 
                    is_escort_assigned = true,
                    escort_trip_id = NEW.id,
                    escort_assigned_at = NEW.escort_assigned_at
                WHERE id = vehicle_id::uuid;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update vehicle escort status
DROP TRIGGER IF EXISTS trigger_update_vehicle_escort_status ON trips;
CREATE TRIGGER trigger_update_vehicle_escort_status
    AFTER UPDATE OF escort_vehicle_ids ON trips
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_escort_status();

-- Create function to clean up escort assignments when trip is deleted
CREATE OR REPLACE FUNCTION cleanup_vehicle_escort_on_trip_delete()
RETURNS TRIGGER AS $$
DECLARE
    vehicle_id TEXT;
BEGIN
    -- Remove escort assignment from all vehicles assigned to this trip
    IF OLD.escort_vehicle_ids IS NOT NULL THEN
        FOR vehicle_id IN SELECT jsonb_array_elements_text(OLD.escort_vehicle_ids)
        LOOP
            UPDATE vehicles 
            SET 
                is_escort_assigned = false,
                escort_trip_id = NULL,
                escort_assigned_at = NULL
            WHERE id = vehicle_id::uuid;
        END LOOP;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to clean up escort assignments when trip is deleted
DROP TRIGGER IF EXISTS trigger_cleanup_vehicle_escort_on_trip_delete ON trips;
CREATE TRIGGER trigger_cleanup_vehicle_escort_on_trip_delete
    BEFORE DELETE ON trips
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_vehicle_escort_on_trip_delete(); 
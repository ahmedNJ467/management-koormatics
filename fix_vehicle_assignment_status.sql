-- Fix Vehicle Assignment Status When Trips Are Cancelled
-- Run this in Supabase SQL Editor to resolve the issue where vehicles show "assigned" 
-- even after trips are cancelled

-- Step 1: Create a comprehensive function to clean up vehicle assignments when trip status changes
CREATE OR REPLACE FUNCTION cleanup_vehicle_assignments_on_trip_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If trip is being cancelled, clear all vehicle assignments
    IF NEW.status = 'cancelled' THEN
        -- Clear primary vehicle assignment
        UPDATE vehicles 
        SET 
            status = 'active',
            updated_at = NOW()
        WHERE id = NEW.vehicle_id;
        
        -- Clear escort vehicle assignments
        UPDATE vehicles 
        SET 
            is_escort_assigned = false,
            escort_trip_id = NULL,
            escort_assigned_at = NULL,
            updated_at = NOW()
        WHERE escort_trip_id = NEW.id;
        
        -- Clear assigned_vehicle_ids array
        UPDATE trips 
        SET 
            assigned_vehicle_ids = '[]'::jsonb,
            escort_vehicle_ids = '[]'::jsonb,
            escort_status = 'not_assigned',
            updated_at = NOW()
        WHERE id = NEW.id;
        
        -- Log the cleanup for debugging
        RAISE NOTICE 'Cleaned up vehicle assignments for cancelled trip %', NEW.id;
    END IF;
    
    -- If trip is being completed, also clear assignments
    IF NEW.status = 'completed' THEN
        -- Clear primary vehicle assignment
        UPDATE vehicles 
        SET 
            status = 'active',
            updated_at = NOW()
        WHERE id = NEW.vehicle_id;
        
        -- Clear escort vehicle assignments
        UPDATE vehicles 
        SET 
            is_escort_assigned = false,
            escort_trip_id = NULL,
            escort_assigned_at = NULL,
            updated_at = NOW()
        WHERE escort_trip_id = NEW.id;
        
        -- Clear assigned_vehicle_ids array
        UPDATE trips 
        SET 
            assigned_vehicle_ids = '[]'::jsonb,
            escort_vehicle_ids = '[]'::jsonb,
            escort_status = 'not_assigned',
            updated_at = NOW()
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Cleaned up vehicle assignments for completed trip %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create trigger to automatically clean up vehicle assignments
DROP TRIGGER IF EXISTS trigger_cleanup_vehicle_assignments ON trips;
CREATE TRIGGER trigger_cleanup_vehicle_assignments
    AFTER UPDATE OF status ON trips
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_vehicle_assignments_on_trip_status_change();

-- Step 3: Create a function to manually clean up any existing orphaned assignments
CREATE OR REPLACE FUNCTION cleanup_orphaned_vehicle_assignments()
RETURNS void AS $$
BEGIN
    -- Clear escort assignments for cancelled/completed trips
    UPDATE vehicles 
    SET 
        is_escort_assigned = false,
        escort_trip_id = NULL,
        escort_assigned_at = NULL,
        updated_at = NOW()
    WHERE escort_trip_id IN (
        SELECT id FROM trips 
        WHERE status IN ('cancelled', 'completed')
    );
    
    -- Reset vehicle status for cancelled/completed trips
    UPDATE vehicles 
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE id IN (
        SELECT vehicle_id FROM trips 
        WHERE status IN ('cancelled', 'completed') 
        AND vehicle_id IS NOT NULL
    );
    
    -- Clear assigned_vehicle_ids for cancelled/completed trips
    UPDATE trips 
    SET 
        assigned_vehicle_ids = '[]'::jsonb,
        escort_vehicle_ids = '[]'::jsonb,
        escort_status = 'not_assigned',
        updated_at = NOW()
    WHERE status IN ('cancelled', 'completed');
    
    RAISE NOTICE 'Cleaned up orphaned vehicle assignments';
END;
$$ LANGUAGE plpgsql;

-- Step 4: Run the cleanup function to fix existing data
SELECT cleanup_orphaned_vehicle_assignments();

-- Step 5: Verify the fix by checking vehicle status
SELECT 
    v.id,
    v.make,
    v.model,
    v.registration,
    v.status as vehicle_status,
    v.is_escort_assigned,
    v.escort_trip_id,
    t.id as trip_id,
    t.status as trip_status,
    t.assigned_vehicle_ids,
    t.escort_vehicle_ids
FROM vehicles v
LEFT JOIN trips t ON v.id = t.vehicle_id OR v.escort_trip_id = t.id
WHERE v.status != 'active' OR v.is_escort_assigned = true
ORDER BY v.id;

-- Step 6: Show summary of what was cleaned up
SELECT 
    'Vehicles with escort assignments' as category,
    COUNT(*) as count
FROM vehicles 
WHERE is_escort_assigned = true
UNION ALL
SELECT 
    'Vehicles not active' as category,
    COUNT(*) as count
FROM vehicles 
WHERE status != 'active'
UNION ALL
SELECT 
    'Trips with vehicle assignments' as category,
    COUNT(*) as count
FROM trips 
WHERE (assigned_vehicle_ids IS NOT NULL AND assigned_vehicle_ids != '[]'::jsonb)
   OR (escort_vehicle_ids IS NOT NULL AND escort_vehicle_ids != '[]'::jsonb);

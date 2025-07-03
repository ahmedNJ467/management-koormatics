-- Check if security escort fields exist in trips table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name IN ('has_security_escort', 'escort_count', 'escort_vehicle_ids', 'escort_status', 'escort_assigned_at')
ORDER BY column_name;

-- Check if there are any trips with security escort enabled
SELECT 
    COUNT(*) as total_trips,
    COUNT(CASE WHEN has_security_escort = true THEN 1 END) as security_escort_trips
FROM trips;

-- Show sample trips with security escort data
SELECT 
    id,
    date,
    time,
    pickup_location,
    dropoff_location,
    has_security_escort,
    escort_count,
    escort_status,
    escort_vehicle_ids,
    notes
FROM trips 
WHERE has_security_escort = true 
LIMIT 5; 
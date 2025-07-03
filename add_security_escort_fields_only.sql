-- Add security escort fields to trips table
-- Run this in Supabase SQL editor to enable security escort functionality

-- Add security escort fields to trips table
ALTER TABLE trips ADD COLUMN IF NOT EXISTS has_security_escort BOOLEAN DEFAULT false;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS escort_count INTEGER DEFAULT 0;

-- Add constraint to limit escort count to maximum of 2
DO $$ BEGIN
    ALTER TABLE trips ADD CONSTRAINT check_escort_count_limit CHECK (escort_count >= 0 AND escort_count <= 2);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add index for efficient querying of security escort trips
CREATE INDEX IF NOT EXISTS idx_trips_security_escort ON trips(has_security_escort);

-- Add comments for documentation
COMMENT ON COLUMN trips.has_security_escort IS 'Whether trip requires security escort vehicles';
COMMENT ON COLUMN trips.escort_count IS 'Number of escort vehicles required (maximum 2)';

-- Verify the fields were added successfully
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'trips' 
AND column_name IN ('has_security_escort', 'escort_count')
ORDER BY column_name; 
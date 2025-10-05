-- Add driver_id column to vehicle_incident_reports table
-- This migration adds the missing driver_id column and foreign key constraint

-- =====================================================
-- 1. ADD DRIVER_ID COLUMN
-- =====================================================

-- Add driver_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_incident_reports' 
        AND column_name = 'driver_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vehicle_incident_reports 
        ADD COLUMN driver_id UUID;
    END IF;
END $$;

-- =====================================================
-- 2. ADD FOREIGN KEY CONSTRAINT
-- =====================================================

-- Add foreign key constraint from vehicle_incident_reports.driver_id to drivers.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicle_incident_reports_driver_id_fkey' 
        AND table_name = 'vehicle_incident_reports'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vehicle_incident_reports 
        ADD CONSTRAINT vehicle_incident_reports_driver_id_fkey 
        FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- 3. CREATE INDEX FOR PERFORMANCE
-- =====================================================

-- Create index on driver_id for better query performance
CREATE INDEX IF NOT EXISTS idx_vehicle_incident_reports_driver_id 
    ON public.vehicle_incident_reports(driver_id);

-- =====================================================
-- 7. VERIFY SETUP
-- =====================================================

-- Check that the driver_id column and constraint are properly set up
DO $$
DECLARE
    driver_id_exists BOOLEAN;
    fk_exists BOOLEAN;
    index_exists BOOLEAN;
BEGIN
    -- Check if driver_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vehicle_incident_reports' 
        AND column_name = 'driver_id'
        AND table_schema = 'public'
    ) INTO driver_id_exists;
    
    -- Check if foreign key constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'vehicle_incident_reports_driver_id_fkey' 
        AND table_name = 'vehicle_incident_reports'
        AND table_schema = 'public'
    ) INTO fk_exists;
    
    -- Check if index exists
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_vehicle_incident_reports_driver_id'
    ) INTO index_exists;
    
    RAISE NOTICE 'Vehicle Incident Reports Setup Status:';
    RAISE NOTICE '  driver_id column exists: %', driver_id_exists;
    RAISE NOTICE '  foreign key constraint exists: %', fk_exists;
    RAISE NOTICE '  index exists: %', index_exists;
    
    IF driver_id_exists AND fk_exists AND index_exists THEN
        RAISE NOTICE '✅ Vehicle incident reports setup completed successfully!';
    ELSE
        RAISE NOTICE '❌ Vehicle incident reports setup incomplete.';
    END IF;
END $$;

-- Fix fuel_logs table foreign key constraint
-- This migration adds the missing foreign key constraint to vehicles table

-- =====================================================
-- 1. ADD FOREIGN KEY CONSTRAINT TO FUEL_LOGS
-- =====================================================

-- Add foreign key constraint from fuel_logs.vehicle_id to vehicles.id
ALTER TABLE public.fuel_logs 
ADD CONSTRAINT fuel_logs_vehicle_id_fkey 
FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE CASCADE;

-- =====================================================
-- 2. ADD FOREIGN KEY CONSTRAINT TO TANK_FILLS
-- =====================================================

-- Add foreign key constraint from tank_fills.tank_id to fuel_tanks.id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tank_fills_tank_id_fkey' 
        AND table_name = 'tank_fills'
    ) THEN
        ALTER TABLE public.tank_fills 
        ADD CONSTRAINT tank_fills_tank_id_fkey 
        FOREIGN KEY (tank_id) REFERENCES public.fuel_tanks(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 3. ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Add foreign key constraint for trips.vehicle_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trips_vehicle_id_fkey' 
        AND table_name = 'trips'
    ) THEN
        ALTER TABLE public.trips 
        ADD CONSTRAINT trips_vehicle_id_fkey 
        FOREIGN KEY (vehicle_id) REFERENCES public.vehicles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint for trips.driver_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trips_driver_id_fkey' 
        AND table_name = 'trips'
    ) THEN
        ALTER TABLE public.trips 
        ADD CONSTRAINT trips_driver_id_fkey 
        FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add foreign key constraint for trips.client_id if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'trips_client_id_fkey' 
        AND table_name = 'trips'
    ) THEN
        ALTER TABLE public.trips 
        ADD CONSTRAINT trips_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;
    END IF;
END $$;

-- =====================================================
-- 4. CREATE INDEXES FOR BETTER PERFORMANCE
-- =====================================================

-- Create indexes for foreign key columns
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON public.fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_client_id ON public.trips(client_id);
CREATE INDEX IF NOT EXISTS idx_tank_fills_tank_id ON public.tank_fills(tank_id);

-- =====================================================
-- 5. VERIFY CONSTRAINTS
-- =====================================================

-- Check that all foreign key constraints are properly set up
DO $$
DECLARE
    constraint_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO constraint_count
    FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_schema = 'public'
    AND table_name IN ('fuel_logs', 'trips', 'tank_fills');
    
    RAISE NOTICE 'Foreign key constraints created: %', constraint_count;
    
    IF constraint_count >= 5 THEN
        RAISE NOTICE '✅ All foreign key constraints are properly set up!';
    ELSE
        RAISE NOTICE '❌ Some foreign key constraints may be missing.';
    END IF;
END $$;

-- Fix RLS policies for fuel_logs and vehicles tables
-- This migration ensures proper access control for fuel logs queries

-- =====================================================
-- 1. ENABLE RLS ON FUEL_LOGS TABLE
-- =====================================================

-- Enable RLS on fuel_logs table
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view fuel logs" ON public.fuel_logs;
DROP POLICY IF EXISTS "Authenticated users can manage fuel logs" ON public.fuel_logs;

-- Create simple policies for fuel_logs
CREATE POLICY "Authenticated users can view fuel logs" ON public.fuel_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage fuel logs" ON public.fuel_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. ENABLE RLS ON VEHICLES TABLE
-- =====================================================

-- Enable RLS on vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Authenticated users can manage vehicles" ON public.vehicles;

-- Create simple policies for vehicles
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage vehicles" ON public.vehicles
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 3. ENABLE RLS ON DRIVERS TABLE
-- =====================================================

-- Enable RLS on drivers table
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view drivers" ON public.drivers;
DROP POLICY IF EXISTS "Authenticated users can manage drivers" ON public.drivers;

-- Create simple policies for drivers
CREATE POLICY "Authenticated users can view drivers" ON public.drivers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage drivers" ON public.drivers
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. ENABLE RLS ON CLIENTS TABLE
-- =====================================================

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Authenticated users can manage clients" ON public.clients;

-- Create simple policies for clients
CREATE POLICY "Authenticated users can view clients" ON public.clients
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage clients" ON public.clients
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 5. ENABLE RLS ON TRIPS TABLE
-- =====================================================

-- Enable RLS on trips table
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can manage trips" ON public.trips;

-- Create simple policies for trips
CREATE POLICY "Authenticated users can view trips" ON public.trips
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage trips" ON public.trips
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 6. ENABLE RLS ON MAINTENANCE TABLE
-- =====================================================

-- Enable RLS on maintenance table
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view maintenance" ON public.maintenance;
DROP POLICY IF EXISTS "Authenticated users can manage maintenance" ON public.maintenance;

-- Create simple policies for maintenance
CREATE POLICY "Authenticated users can view maintenance" ON public.maintenance
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage maintenance" ON public.maintenance
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on all tables
GRANT ALL ON public.fuel_logs TO authenticated, anon, service_role;
GRANT ALL ON public.vehicles TO authenticated, anon, service_role;
GRANT ALL ON public.drivers TO authenticated, anon, service_role;
GRANT ALL ON public.clients TO authenticated, anon, service_role;
GRANT ALL ON public.trips TO authenticated, anon, service_role;
GRANT ALL ON public.maintenance TO authenticated, anon, service_role;
GRANT ALL ON public.fuel_tanks TO authenticated, anon, service_role;
GRANT ALL ON public.tank_fills TO authenticated, anon, service_role;

-- =====================================================
-- 8. VERIFY SETUP
-- =====================================================

-- Check that all tables have RLS enabled and policies
DO $$
DECLARE
    rls_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Count tables with RLS enabled
    SELECT COUNT(*) INTO rls_count
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity = true
    AND c.relname IN ('fuel_logs', 'vehicles', 'drivers', 'clients', 'trips', 'maintenance');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    AND p.tablename IN ('fuel_logs', 'vehicles', 'drivers', 'clients', 'trips', 'maintenance');
    
    RAISE NOTICE 'Tables with RLS enabled: %', rls_count;
    RAISE NOTICE 'Total policies created: %', policy_count;
    
    IF rls_count >= 6 AND policy_count >= 12 THEN
        RAISE NOTICE '✅ RLS setup completed successfully!';
    ELSE
        RAISE NOTICE '❌ RLS setup incomplete.';
    END IF;
END $$;

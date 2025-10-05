-- Fix missing RLS policy for vehicle_incident_reports SELECT operations
-- This migration adds the missing SELECT policy that's causing the 400 error

-- =====================================================
-- 1. ADD MISSING SELECT POLICY
-- =====================================================

-- Add all missing policies for vehicle_incident_reports
CREATE POLICY "Users can view incident reports" ON "public"."vehicle_incident_reports"
    FOR SELECT USING (true);

CREATE POLICY "Users can create incident reports" ON "public"."vehicle_incident_reports"
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update incident reports" ON "public"."vehicle_incident_reports"
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete incident reports" ON "public"."vehicle_incident_reports"
    FOR DELETE USING (true);

-- =====================================================
-- 2. VERIFY RLS IS ENABLED
-- =====================================================

-- Ensure RLS is enabled on the table
ALTER TABLE "public"."vehicle_incident_reports" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. VERIFY ALL POLICIES EXIST
-- =====================================================

-- Check that all required policies exist
DO $$
DECLARE
    select_policy_exists BOOLEAN;
    insert_policy_exists BOOLEAN;
    update_policy_exists BOOLEAN;
    delete_policy_exists BOOLEAN;
BEGIN
    -- Check if SELECT policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicle_incident_reports' 
        AND policyname = 'Users can view incident reports'
    ) INTO select_policy_exists;
    
    -- Check if INSERT policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicle_incident_reports' 
        AND policyname = 'Users can create incident reports'
    ) INTO insert_policy_exists;
    
    -- Check if UPDATE policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicle_incident_reports' 
        AND policyname = 'Users can update incident reports'
    ) INTO update_policy_exists;
    
    -- Check if DELETE policy exists
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'vehicle_incident_reports' 
        AND policyname = 'Users can delete incident reports'
    ) INTO delete_policy_exists;
    
    -- Log the results
    RAISE NOTICE 'RLS Policies Status:';
    RAISE NOTICE 'SELECT policy exists: %', select_policy_exists;
    RAISE NOTICE 'INSERT policy exists: %', insert_policy_exists;
    RAISE NOTICE 'UPDATE policy exists: %', update_policy_exists;
    RAISE NOTICE 'DELETE policy exists: %', delete_policy_exists;
    
    -- Ensure all policies exist
    IF NOT select_policy_exists THEN
        RAISE EXCEPTION 'SELECT policy is missing for vehicle_incident_reports';
    END IF;
    
    IF NOT insert_policy_exists THEN
        RAISE EXCEPTION 'INSERT policy is missing for vehicle_incident_reports';
    END IF;
    
    IF NOT update_policy_exists THEN
        RAISE EXCEPTION 'UPDATE policy is missing for vehicle_incident_reports';
    END IF;
    
    IF NOT delete_policy_exists THEN
        RAISE EXCEPTION 'DELETE policy is missing for vehicle_incident_reports';
    END IF;
    
    RAISE NOTICE 'All RLS policies are properly configured for vehicle_incident_reports';
END $$;

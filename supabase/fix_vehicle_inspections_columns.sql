-- Fix vehicle_inspections table: Add missing columns
-- Run this in the Supabase SQL Editor

-- Step 0: Add basic required columns if they don't exist and fix inspection_type
DO $$
BEGIN
    -- mileage
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'mileage'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN mileage INTEGER DEFAULT 0;
        RAISE NOTICE 'Added mileage column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'mileage column already exists in vehicle_inspections table';
    END IF;

    -- inspector_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'inspector_name'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN inspector_name TEXT;
        RAISE NOTICE 'Added inspector_name column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'inspector_name column already exists in vehicle_inspections table';
    END IF;

    -- inspection_date
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'inspection_date'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN inspection_date DATE;
        RAISE NOTICE 'Added inspection_date column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'inspection_date column already exists in vehicle_inspections table';
    END IF;

    -- inspection_type: Make it nullable or set default if it exists and is NOT NULL
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'inspection_type'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop the NOT NULL constraint and set a default
        ALTER TABLE public.vehicle_inspections 
        ALTER COLUMN inspection_type DROP NOT NULL,
        ALTER COLUMN inspection_type SET DEFAULT 'general';
        RAISE NOTICE 'Made inspection_type nullable with default value';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'inspection_type'
    ) THEN
        -- Add inspection_type if it doesn't exist
        ALTER TABLE public.vehicle_inspections ADD COLUMN inspection_type TEXT DEFAULT 'general';
        RAISE NOTICE 'Added inspection_type column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'inspection_type column already exists and is nullable';
    END IF;

    -- status: Make it nullable or set default if it exists and is NOT NULL
    -- Also map it to overall_status if overall_status exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'status'
        AND is_nullable = 'NO'
    ) THEN
        -- Drop the NOT NULL constraint and set a default
        ALTER TABLE public.vehicle_inspections 
        ALTER COLUMN status DROP NOT NULL,
        ALTER COLUMN status SET DEFAULT 'passed';
        RAISE NOTICE 'Made status nullable with default value';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'status'
    ) THEN
        -- Add status if it doesn't exist (only if overall_status doesn't exist)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'vehicle_inspections'
            AND column_name = 'overall_status'
        ) THEN
            ALTER TABLE public.vehicle_inspections ADD COLUMN status TEXT DEFAULT 'passed';
            RAISE NOTICE 'Added status column to vehicle_inspections table';
        ELSE
            RAISE NOTICE 'status column does not exist but overall_status exists - skipping';
        END IF;
    ELSE
        RAISE NOTICE 'status column already exists and is nullable';
    END IF;
END $$;

-- Step 1: Add 'brake_fluid' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'brake_fluid'
    ) THEN
        ALTER TABLE public.vehicle_inspections
        ADD COLUMN brake_fluid TEXT CHECK (brake_fluid IN ('good', 'low', 'needs_refill'));

        RAISE NOTICE 'Added brake_fluid column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'brake_fluid column already exists in vehicle_inspections table';
    END IF;
END $$;

-- Step 2: Add 'engine_oil' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'engine_oil'
    ) THEN
        ALTER TABLE public.vehicle_inspections
        ADD COLUMN engine_oil TEXT CHECK (engine_oil IN ('good', 'low', 'needs_change'));

        RAISE NOTICE 'Added engine_oil column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'engine_oil column already exists in vehicle_inspections table';
    END IF;
END $$;

-- Step 3: Add 'coolant' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'coolant'
    ) THEN
        ALTER TABLE public.vehicle_inspections
        ADD COLUMN coolant TEXT CHECK (coolant IN ('good', 'low', 'needs_refill'));

        RAISE NOTICE 'Added coolant column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'coolant column already exists in vehicle_inspections table';
    END IF;
END $$;

-- Step 4: Add 'fuel_level' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'fuel_level'
    ) THEN
        ALTER TABLE public.vehicle_inspections
        ADD COLUMN fuel_level INTEGER CHECK (fuel_level >= 0 AND fuel_level <= 100);

        RAISE NOTICE 'Added fuel_level column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'fuel_level column already exists in vehicle_inspections table';
    END IF;
END $$;

-- Step 5: Add 'tires_condition' column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'tires_condition'
    ) THEN
        ALTER TABLE public.vehicle_inspections
        ADD COLUMN tires_condition TEXT CHECK (tires_condition IN ('good', 'fair', 'poor'));

        RAISE NOTICE 'Added tires_condition column to vehicle_inspections table';
    ELSE
        RAISE NOTICE 'tires_condition column already exists in vehicle_inspections table';
    END IF;
END $$;

-- Step 6: Add safety system boolean columns
DO $$
BEGIN
    -- lights_working
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'lights_working'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN lights_working BOOLEAN DEFAULT true;
    END IF;

    -- brakes_working
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'brakes_working'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN brakes_working BOOLEAN DEFAULT true;
    END IF;

    -- steering_working
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'steering_working'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN steering_working BOOLEAN DEFAULT true;
    END IF;

    -- horn_working
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'horn_working'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN horn_working BOOLEAN DEFAULT true;
    END IF;

    -- wipers_working
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'wipers_working'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN wipers_working BOOLEAN DEFAULT true;
    END IF;

    -- mirrors_clean
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'mirrors_clean'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN mirrors_clean BOOLEAN DEFAULT true;
    END IF;

    -- seatbelts_working
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'seatbelts_working'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN seatbelts_working BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Step 7: Add safety equipment boolean columns
DO $$
BEGIN
    -- first_aid_kit
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'first_aid_kit'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN first_aid_kit BOOLEAN DEFAULT true;
    END IF;

    -- fire_extinguisher
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'fire_extinguisher'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN fire_extinguisher BOOLEAN DEFAULT true;
    END IF;

    -- warning_triangle
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'warning_triangle'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN warning_triangle BOOLEAN DEFAULT true;
    END IF;

    -- jack_spare_tire
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'jack_spare_tire'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN jack_spare_tire BOOLEAN DEFAULT true;
    END IF;

    -- documents_present
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'documents_present'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN documents_present BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Step 8: Add cleanliness boolean columns
DO $$
BEGIN
    -- interior_clean
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'interior_clean'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN interior_clean BOOLEAN DEFAULT true;
    END IF;

    -- exterior_clean
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'exterior_clean'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN exterior_clean BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Step 9: Add notes columns if they don't exist
DO $$
BEGIN
    -- defects_noted
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'defects_noted'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN defects_noted TEXT;
    END IF;

    -- corrective_actions
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'corrective_actions'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN corrective_actions TEXT;
    END IF;
END $$;

-- Step 10: Add 'overall_status' column if it doesn't exist (with correct enum values)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'overall_status'
    ) THEN
        ALTER TABLE public.vehicle_inspections
        ADD COLUMN overall_status TEXT CHECK (overall_status IN ('pass', 'fail', 'conditional')) DEFAULT 'pass';
    ELSE
        -- If column exists but doesn't have the right check constraint, update it
        ALTER TABLE public.vehicle_inspections
        DROP CONSTRAINT IF EXISTS vehicle_inspections_overall_status_check;
        
        ALTER TABLE public.vehicle_inspections
        ADD CONSTRAINT vehicle_inspections_overall_status_check 
        CHECK (overall_status IN ('pass', 'fail', 'conditional'));
    END IF;
END $$;

-- Step 11: Add 'pre_trip' and 'post_trip' columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'pre_trip'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN pre_trip BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'vehicle_inspections'
        AND column_name = 'post_trip'
    ) THEN
        ALTER TABLE public.vehicle_inspections ADD COLUMN post_trip BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Verification: Check the table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'vehicle_inspections'
ORDER BY ordinal_position;


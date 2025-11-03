-- Fix spare_parts table to match form fields
-- Add missing columns and rename unit_cost to unit_price

-- Step 1: Rename unit_cost to unit_price if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'spare_parts' 
               AND column_name = 'unit_cost') THEN
        ALTER TABLE public.spare_parts RENAME COLUMN unit_cost TO unit_price;
    END IF;
END $$;

-- Step 2: Add missing required columns
-- category (required)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'category') THEN
        ALTER TABLE public.spare_parts ADD COLUMN category TEXT NOT NULL DEFAULT 'General';
    ELSE
        ALTER TABLE public.spare_parts 
          ALTER COLUMN category TYPE TEXT,
          ALTER COLUMN category SET NOT NULL,
          ALTER COLUMN category SET DEFAULT 'General';
    END IF;
END $$;

-- manufacturer (required)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'manufacturer') THEN
        ALTER TABLE public.spare_parts ADD COLUMN manufacturer TEXT NOT NULL DEFAULT 'Unknown';
    ELSE
        ALTER TABLE public.spare_parts 
          ALTER COLUMN manufacturer TYPE TEXT,
          ALTER COLUMN manufacturer SET NOT NULL,
          ALTER COLUMN manufacturer SET DEFAULT 'Unknown';
    END IF;
END $$;

-- location (required)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'location') THEN
        ALTER TABLE public.spare_parts ADD COLUMN location TEXT NOT NULL DEFAULT 'Warehouse';
    ELSE
        ALTER TABLE public.spare_parts 
          ALTER COLUMN location TYPE TEXT,
          ALTER COLUMN location SET NOT NULL,
          ALTER COLUMN location SET DEFAULT 'Warehouse';
    END IF;
END $$;

-- status (required, computed from quantity)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'status') THEN
        ALTER TABLE public.spare_parts ADD COLUMN status TEXT NOT NULL DEFAULT 'out_of_stock';
    ELSE
        ALTER TABLE public.spare_parts 
          ALTER COLUMN status TYPE TEXT,
          ALTER COLUMN status SET NOT NULL,
          ALTER COLUMN status SET DEFAULT 'out_of_stock';
    END IF;
END $$;

-- min_stock_level (required)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'min_stock_level') THEN
        ALTER TABLE public.spare_parts ADD COLUMN min_stock_level INTEGER NOT NULL DEFAULT 0;
    ELSE
        ALTER TABLE public.spare_parts 
          ALTER COLUMN min_stock_level TYPE INTEGER USING min_stock_level::INTEGER,
          ALTER COLUMN min_stock_level SET NOT NULL,
          ALTER COLUMN min_stock_level SET DEFAULT 0;
    END IF;
END $$;

-- purchase_date (optional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'purchase_date') THEN
        ALTER TABLE public.spare_parts ADD COLUMN purchase_date DATE;
    END IF;
END $$;

-- compatibility (optional, array)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'compatibility') THEN
        ALTER TABLE public.spare_parts ADD COLUMN compatibility TEXT[];
    END IF;
END $$;

-- unit_price (if not exists after rename)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'spare_parts' 
                   AND column_name = 'unit_price') THEN
        ALTER TABLE public.spare_parts ADD COLUMN unit_price DECIMAL(10,2) DEFAULT 0;
    ELSE
        ALTER TABLE public.spare_parts 
          ALTER COLUMN unit_price TYPE DECIMAL(10,2),
          ALTER COLUMN unit_price SET DEFAULT 0;
    END IF;
END $$;

-- Ensure other required columns exist and have correct types
DO $$
BEGIN
    -- name (required)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'spare_parts' 
               AND column_name = 'name') THEN
        ALTER TABLE public.spare_parts ALTER COLUMN name SET NOT NULL;
    END IF;
    
    -- part_number (required but can be unique)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'spare_parts' 
               AND column_name = 'part_number') THEN
        ALTER TABLE public.spare_parts ALTER COLUMN part_number SET NOT NULL;
    END IF;
    
    -- quantity (default 0)
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'public' 
               AND table_name = 'spare_parts' 
               AND column_name = 'quantity') THEN
        ALTER TABLE public.spare_parts 
          ALTER COLUMN quantity TYPE INTEGER USING quantity::INTEGER,
          ALTER COLUMN quantity SET DEFAULT 0;
    END IF;
END $$;


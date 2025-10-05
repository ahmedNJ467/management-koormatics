-- Create fuel_management table for fuel storage management
-- This migration creates the missing fuel_management table

-- =====================================================
-- 1. CREATE FUEL_MANAGEMENT TABLE
-- =====================================================

-- Create fuel_management table for managing fuel storage/tanks
CREATE TABLE IF NOT EXISTS public.fuel_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fuel_type fuel_type NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. CREATE FUEL_FILLS TABLE (if missing)
-- =====================================================

-- Create fuel_fills table for tracking fuel fills
CREATE TABLE IF NOT EXISTS public.fuel_fills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fuel_management_id UUID REFERENCES public.fuel_management(id) ON DELETE CASCADE,
  fill_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  cost_per_liter NUMERIC,
  total_cost NUMERIC,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. ADD FOREIGN KEY CONSTRAINT TO FUEL_LOGS
-- =====================================================

-- Add foreign key constraint from fuel_logs.fuel_management_id to fuel_management.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fuel_logs_fuel_management_id_fkey' 
        AND table_name = 'fuel_logs'
    ) THEN
        ALTER TABLE public.fuel_logs 
        ADD CONSTRAINT fuel_logs_fuel_management_id_fkey 
        FOREIGN KEY (fuel_management_id) REFERENCES public.fuel_management(id) ON DELETE SET NULL;
    END IF;
END $$;

-- =====================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_fuel_management_fuel_type ON public.fuel_management(fuel_type);
CREATE INDEX IF NOT EXISTS idx_fuel_fills_fuel_management_id ON public.fuel_fills(fuel_management_id);
CREATE INDEX IF NOT EXISTS idx_fuel_fills_fill_date ON public.fuel_fills(fill_date);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_fuel_management_id ON public.fuel_logs(fuel_management_id);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on fuel_management table
ALTER TABLE public.fuel_management ENABLE ROW LEVEL SECURITY;

-- Enable RLS on fuel_fills table
ALTER TABLE public.fuel_fills ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Create policies for fuel_management table
CREATE POLICY "Authenticated users can view fuel management" ON public.fuel_management
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage fuel management" ON public.fuel_management
  FOR ALL USING (auth.role() = 'authenticated');

-- Create policies for fuel_fills table
CREATE POLICY "Authenticated users can view fuel fills" ON public.fuel_fills
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage fuel fills" ON public.fuel_fills
  FOR ALL USING (auth.role() = 'authenticated');

-- =====================================================
-- 7. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on both tables
GRANT ALL ON public.fuel_management TO authenticated, anon, service_role;
GRANT ALL ON public.fuel_fills TO authenticated, anon, service_role;

-- =====================================================
-- 8. INSERT DEFAULT DATA
-- =====================================================

-- Insert default fuel management entries
INSERT INTO public.fuel_management (name, fuel_type) VALUES
  ('Main Petrol Tank', 'petrol'),
  ('Main Diesel Tank', 'diesel'),
  ('Reserve Petrol Tank', 'petrol'),
  ('Reserve Diesel Tank', 'diesel'),
  ('Emergency Fuel Storage', 'petrol')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VERIFY SETUP
-- =====================================================

-- Check that everything is set up correctly
DO $$
DECLARE
  fuel_mgmt_count INTEGER;
  fuel_fills_count INTEGER;
  constraint_count INTEGER;
BEGIN
  -- Count records in fuel_management
  SELECT COUNT(*) INTO fuel_mgmt_count FROM public.fuel_management;
  
  -- Count records in fuel_fills
  SELECT COUNT(*) INTO fuel_fills_count FROM public.fuel_fills;
  
  -- Count foreign key constraints
  SELECT COUNT(*) INTO constraint_count
  FROM information_schema.table_constraints 
  WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public'
  AND table_name IN ('fuel_management', 'fuel_fills', 'fuel_logs');
  
  RAISE NOTICE 'Fuel Management Setup Status:';
  RAISE NOTICE '  Fuel management records: %', fuel_mgmt_count;
  RAISE NOTICE '  Fuel fills records: %', fuel_fills_count;
  RAISE NOTICE '  Foreign key constraints: %', constraint_count;
  
  IF fuel_mgmt_count > 0 THEN
    RAISE NOTICE '✅ Fuel management table setup completed successfully!';
  ELSE
    RAISE NOTICE '❌ Fuel management table setup incomplete.';
  END IF;
END $$;

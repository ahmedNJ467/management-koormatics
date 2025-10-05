-- Create security_guards table - Manual SQL script
-- Run this in your Supabase Dashboard SQL Editor

-- =====================================================
-- 1. CREATE SECURITY_GUARDS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.security_guards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  id_number TEXT UNIQUE,
  rank TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'leave')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGER
-- =====================================================

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_security_guards_updated_at ON public.security_guards;
CREATE TRIGGER update_security_guards_updated_at
    BEFORE UPDATE ON public.security_guards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE public.security_guards ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CREATE RLS POLICIES
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view security guards" ON public.security_guards;
DROP POLICY IF EXISTS "Users can create security guards" ON public.security_guards;
DROP POLICY IF EXISTS "Users can update security guards" ON public.security_guards;
DROP POLICY IF EXISTS "Users can delete security guards" ON public.security_guards;

-- Create RLS policies
CREATE POLICY "Users can view security guards" ON public.security_guards
    FOR SELECT USING (true);

CREATE POLICY "Users can create security guards" ON public.security_guards
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update security guards" ON public.security_guards
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete security guards" ON public.security_guards
    FOR DELETE USING (true);

-- =====================================================
-- 6. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample security guards
INSERT INTO public.security_guards (
  name,
  phone,
  id_number,
  rank,
  notes,
  status
) VALUES 
(
  'John Smith',
  '+1-555-0101',
  'SG001',
  'Senior Guard',
  'Experienced security guard with 5 years of experience',
  'active'
),
(
  'Maria Garcia',
  '+1-555-0201',
  'SG002',
  'Guard',
  'Bilingual security guard, fluent in English and Spanish',
  'active'
),
(
  'David Johnson',
  '+1-555-0301',
  'SG003',
  'Lead Guard',
  'Armed security guard with tactical training',
  'active'
);

-- =====================================================
-- 7. VERIFY TABLE CREATION
-- =====================================================

-- Verify the table was created successfully
SELECT 
  id,
  name,
  phone,
  id_number,
  rank,
  status,
  created_at
FROM public.security_guards 
ORDER BY created_at DESC;

-- Final verification
SELECT 'Security guards table created successfully' as status;

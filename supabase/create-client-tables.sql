-- Create client_contacts and client_members tables - Manual SQL script
-- Run this in your Supabase Dashboard SQL Editor

-- =====================================================
-- 1. CREATE CLIENT_CONTACTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  position TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE CLIENT_MEMBERS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.client_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT,
  document_name TEXT,
  document_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE UPDATED_AT TRIGGER FUNCTION
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
-- 4. CREATE UPDATED_AT TRIGGERS
-- =====================================================

-- Create trigger for client_contacts updated_at
DROP TRIGGER IF EXISTS update_client_contacts_updated_at ON public.client_contacts;
CREATE TRIGGER update_client_contacts_updated_at
    BEFORE UPDATE ON public.client_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for client_members updated_at
DROP TRIGGER IF EXISTS update_client_members_updated_at ON public.client_members;
CREATE TRIGGER update_client_members_updated_at
    BEFORE UPDATE ON public.client_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on both tables
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE RLS POLICIES FOR CLIENT_CONTACTS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view client contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can create client contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update client contacts" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete client contacts" ON public.client_contacts;

-- Create RLS policies for client_contacts
CREATE POLICY "Users can view client contacts" ON public.client_contacts
    FOR SELECT USING (true);

CREATE POLICY "Users can create client contacts" ON public.client_contacts
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update client contacts" ON public.client_contacts
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete client contacts" ON public.client_contacts
    FOR DELETE USING (true);

-- =====================================================
-- 7. CREATE RLS POLICIES FOR CLIENT_MEMBERS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view client members" ON public.client_members;
DROP POLICY IF EXISTS "Users can create client members" ON public.client_members;
DROP POLICY IF EXISTS "Users can update client members" ON public.client_members;
DROP POLICY IF EXISTS "Users can delete client members" ON public.client_members;

-- Create RLS policies for client_members
CREATE POLICY "Users can view client members" ON public.client_members
    FOR SELECT USING (true);

CREATE POLICY "Users can create client members" ON public.client_members
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update client members" ON public.client_members
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete client members" ON public.client_members
    FOR DELETE USING (true);

-- =====================================================
-- 8. INSERT SAMPLE DATA
-- =====================================================

-- Insert sample client contacts (assuming there are existing clients)
INSERT INTO public.client_contacts (
  client_id,
  name,
  email,
  phone,
  position,
  is_primary
) 
SELECT 
  c.id,
  'John Smith',
  'john.smith@client.com',
  '+1-555-0101',
  'CEO',
  true
FROM public.clients c
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample client members (assuming there are existing clients)
INSERT INTO public.client_members (
  client_id,
  name,
  email,
  phone,
  role,
  document_name,
  notes
)
SELECT 
  c.id,
  'Jane Doe',
  'jane.doe@client.com',
  '+1-555-0201',
  'Manager',
  'ID Document',
  'Primary contact for day-to-day operations'
FROM public.clients c
LIMIT 1
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. VERIFY TABLE CREATION
-- =====================================================

-- Verify the tables were created successfully
SELECT 'client_contacts' as table_name, COUNT(*) as count FROM public.client_contacts
UNION ALL
SELECT 'client_members' as table_name, COUNT(*) as count FROM public.client_members;

-- Final verification
SELECT 'Client tables created successfully' as status;

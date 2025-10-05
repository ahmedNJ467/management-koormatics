-- Restore Database Table Structure
-- Run this in the Supabase SQL Editor to recreate all tables

-- =====================================================
-- 1. CORE USER MANAGEMENT TABLES
-- =====================================================

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  company TEXT,
  profile_image_url TEXT,
  notification_preferences JSONB DEFAULT '{
    "email_notifications": true,
    "push_notifications": true,
    "sms_notifications": false,
    "marketing_emails": false
  }'::jsonb,
  two_factor_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_slug TEXT REFERENCES public.roles(slug) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role_slug)
);

-- =====================================================
-- 2. VEHICLE MANAGEMENT TABLES
-- =====================================================

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('soft_skin', 'armoured')),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  registration TEXT UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  color TEXT,
  vin TEXT UNIQUE,
  insurance_expiry DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'retired')),
  notes TEXT,
  fuel_type TEXT DEFAULT 'petrol' CHECK (fuel_type IN ('petrol', 'diesel')),
  is_escort_assigned BOOLEAN DEFAULT false,
  escort_trip_id UUID,
  escort_assigned_at TIMESTAMPTZ,
  original_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact TEXT,
  license_number TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url TEXT,
  document_url TEXT,
  phone TEXT,
  is_vip BOOLEAN DEFAULT false,
  airport_id_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. CLIENT MANAGEMENT TABLES
-- =====================================================

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('individual', 'organization')),
  contact TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  profile_image_url TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  address TEXT,
  description TEXT,
  website TEXT,
  is_archived BOOLEAN DEFAULT false
);

-- Create client_contacts table
CREATE TABLE IF NOT EXISTS public.client_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create client_members table
CREATE TABLE IF NOT EXISTS public.client_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  document_url TEXT,
  document_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. TRIP MANAGEMENT TABLES
-- =====================================================

-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES public.clients(id),
  vehicle_id UUID REFERENCES public.vehicles(id),
  driver_id UUID REFERENCES public.drivers(id),
  date DATE NOT NULL,
  time TIME NOT NULL,
  return_time TIME,
  actual_pickup_time TIMESTAMPTZ,
  actual_dropoff_time TIMESTAMPTZ,
  service_type TEXT NOT NULL CHECK (service_type IN ('airport_pickup', 'airport_dropoff', 'city_transfer', 'long_distance', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  amount DECIMAL(10,2) DEFAULT 0,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  notes TEXT,
  special_instructions TEXT,
  invoice_id UUID,
  airline TEXT,
  flight_number TEXT,
  terminal TEXT,
  is_recurring BOOLEAN DEFAULT false,
  passengers JSONB DEFAULT '[]'::jsonb,
  log_sheet_url TEXT,
  vehicle_type TEXT,
  passport_documents JSONB DEFAULT '[]'::jsonb,
  invitation_documents JSONB DEFAULT '[]'::jsonb,
  has_security_escort BOOLEAN DEFAULT false,
  escort_count INTEGER DEFAULT 0,
  escort_vehicle_ids JSONB DEFAULT '[]'::jsonb,
  escort_status TEXT DEFAULT 'not_assigned' CHECK (escort_status IN ('not_assigned', 'assigned', 'in_progress', 'completed')),
  escort_assigned_at TIMESTAMPTZ,
  stops JSONB DEFAULT '[]'::jsonb,
  soft_skin_count INTEGER DEFAULT 0,
  armoured_count INTEGER DEFAULT 0,
  assigned_vehicle_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. FINANCIAL TABLES
-- =====================================================

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check')),
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  quotation_id UUID,
  vat_percentage DECIMAL(5,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  client_id UUID REFERENCES public.clients(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  valid_until DATE NOT NULL,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  vat_percentage DECIMAL(5,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. MAINTENANCE TABLES
-- =====================================================

-- Create maintenance table
CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  cost DECIMAL(10,2) DEFAULT 0,
  next_scheduled DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  service_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. FUEL MANAGEMENT TABLES
-- =====================================================

-- Create fuel_management table
CREATE TABLE IF NOT EXISTS public.fuel_management (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create fuel_logs table
CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel')),
  volume DECIMAL(8,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  mileage INTEGER DEFAULT 0,
  notes TEXT,
  previous_mileage INTEGER,
  current_mileage INTEGER,
  fuel_management_id UUID REFERENCES public.fuel_management(id),
  price_per_liter DECIMAL(8,4),
  filled_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. VEHICLE LEASING TABLES
-- =====================================================

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_file TEXT,
  contract_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vehicle_leases table
CREATE TABLE IF NOT EXISTS public.vehicle_leases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lessee_name TEXT NOT NULL,
  lessee_email TEXT,
  lessee_phone TEXT,
  lessee_address TEXT,
  lease_start_date DATE NOT NULL,
  lease_end_date DATE NOT NULL,
  monthly_rate DECIMAL(10,2) NOT NULL,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  lease_status TEXT NOT NULL DEFAULT 'active' CHECK (lease_status IN ('active', 'expired', 'terminated')),
  contract_number TEXT UNIQUE,
  notes TEXT,
  insurance_required BOOLEAN DEFAULT true,
  maintenance_included BOOLEAN DEFAULT true,
  driver_included BOOLEAN DEFAULT false,
  fuel_included BOOLEAN DEFAULT false,
  assigned_driver_id UUID REFERENCES public.drivers(id),
  early_termination_fee DECIMAL(10,2) DEFAULT 0,
  contract_id UUID REFERENCES public.contracts(id),
  daily_rate DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
  client_id UUID REFERENCES public.clients(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 9. SECURITY ESCORT TABLES
-- =====================================================

-- Create security_guards table
CREATE TABLE IF NOT EXISTS public.security_guards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  id_number TEXT UNIQUE NOT NULL,
  rank TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create escort_teams table
CREATE TABLE IF NOT EXISTS public.escort_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT NOT NULL,
  guard_ids JSONB DEFAULT '[]'::jsonb,
  vehicle_id UUID REFERENCES public.vehicles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. VEHICLE INSPECTION TABLES
-- =====================================================

-- Create vehicle_inspections table
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspector_name TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  pre_trip BOOLEAN DEFAULT false,
  post_trip BOOLEAN DEFAULT false,
  overall_status TEXT NOT NULL CHECK (overall_status IN ('pass', 'fail', 'conditional')),
  mileage INTEGER,
  fuel_level INTEGER,
  engine_oil TEXT CHECK (engine_oil IN ('good', 'fair', 'poor')),
  coolant TEXT CHECK (coolant IN ('good', 'fair', 'poor')),
  brake_fluid TEXT CHECK (brake_fluid IN ('good', 'fair', 'poor')),
  tires_condition TEXT CHECK (tires_condition IN ('good', 'fair', 'poor')),
  lights_working BOOLEAN,
  brakes_working BOOLEAN,
  steering_working BOOLEAN,
  horn_working BOOLEAN,
  wipers_working BOOLEAN,
  mirrors_clean BOOLEAN,
  seatbelts_working BOOLEAN,
  first_aid_kit BOOLEAN,
  fire_extinguisher BOOLEAN,
  warning_triangle BOOLEAN,
  jack_spare_tire BOOLEAN,
  documents_present BOOLEAN,
  interior_clean BOOLEAN,
  exterior_clean BOOLEAN,
  defects_noted TEXT,
  corrective_actions TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. INCIDENT REPORTS TABLES
-- =====================================================

-- Create vehicle_incident_reports table
CREATE TABLE IF NOT EXISTS public.vehicle_incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.drivers(id),
  incident_date DATE NOT NULL,
  incident_time TIME NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN ('accident', 'breakdown', 'theft', 'vandalism', 'other')),
  severity TEXT NOT NULL CHECK (severity IN ('minor', 'moderate', 'major', 'critical')),
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  injuries_reported BOOLEAN DEFAULT false,
  third_party_involved BOOLEAN DEFAULT false,
  photos_attached BOOLEAN DEFAULT false,
  police_report_number TEXT,
  insurance_claim_number TEXT,
  estimated_damage_cost DECIMAL(10,2),
  actual_repair_cost DECIMAL(10,2),
  third_party_details TEXT,
  witness_details TEXT,
  reported_by TEXT NOT NULL,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  damage_details TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 12. INVITATION LETTERS TABLE
-- =====================================================

-- Create invitation_letters table
CREATE TABLE IF NOT EXISTS public.invitation_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_number TEXT UNIQUE NOT NULL,
  date DATE NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT NOT NULL,
  company_email TEXT NOT NULL,
  company_phone TEXT NOT NULL,
  guest_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  organization TEXT NOT NULL,
  passport_number TEXT NOT NULL,
  passport_expiry_date DATE NOT NULL,
  subject TEXT NOT NULL,
  purpose_of_visit TEXT NOT NULL,
  file_name TEXT,
  pdf_url TEXT,
  generated_by UUID REFERENCES auth.users(id),
  form_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 13. INTEREST POINTS TABLE
-- =====================================================

-- Create interest_points table
CREATE TABLE IF NOT EXISTS public.interest_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('places', 'hotels', 'airports', 'restaurants', 'other')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  icon TEXT DEFAULT 'location_on',
  color TEXT DEFAULT '#FF6B6B',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 14. ACTIVITIES TABLE
-- =====================================================

-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 15. VIEWS AND FUNCTIONS
-- =====================================================

-- Create vw_user_roles view
CREATE OR REPLACE VIEW public.vw_user_roles AS
SELECT 
  p.id AS user_id,
  p.email,
  p.full_name,
  p.created_at,
  COALESCE(array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL), '{}'::text[]) AS roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.created_at;

-- =====================================================
-- 16. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_guards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escort_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interest_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Create basic policies for authenticated users
CREATE POLICY "Authenticated users can view all" ON public.vehicles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.drivers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.clients FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.trips FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.invoices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.quotations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.maintenance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.fuel_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.contracts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.vehicle_leases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.security_guards FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.escort_teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.vehicle_inspections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.vehicle_incident_reports FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.invitation_letters FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.interest_points FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can view all" ON public.activities FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy for vw_user_roles view
CREATE POLICY "Authenticated view user roles" ON public.vw_user_roles
FOR SELECT USING (auth.role() = 'authenticated');

-- =====================================================
-- 17. TRIGGERS
-- =====================================================

-- Create trigger function to automatically create profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 18. INSERT DEFAULT DATA
-- =====================================================

-- Insert default roles
INSERT INTO public.roles (slug, name) VALUES
  ('super_admin', 'Super Administrator'),
  ('fleet_manager', 'Fleet Manager'),
  ('operations_manager', 'Operations Manager'),
  ('finance_manager', 'Finance Manager')
ON CONFLICT (slug) DO NOTHING;

-- Insert default fuel types
INSERT INTO public.fuel_management (name, fuel_type) VALUES
  ('Petrol', 'petrol'),
  ('Diesel', 'diesel')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 19. VERIFICATION
-- =====================================================

-- Test the setup
SELECT 'Database structure restored successfully!' as status;
SELECT COUNT(*) as tables_created FROM information_schema.tables WHERE table_schema = 'public';
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Create comprehensive database schema based on frontend requirements
-- This migration creates all necessary tables for the Koormatics management system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER MANAGEMENT TABLES
-- =====================================================

-- Create profiles table for user information
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create roles table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_roles join table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_slug TEXT REFERENCES public.roles(slug) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, role_slug)
);

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
-- 2. FLEET MANAGEMENT TABLES
-- =====================================================

-- Create fuel_type enum
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'hybrid', 'electric');

-- Create vehicle_status enum
CREATE TYPE vehicle_status AS ENUM ('active', 'in_service', 'inactive');

-- Create vehicle_type enum
CREATE TYPE vehicle_type AS ENUM ('armoured', 'soft_skin');

-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  registration TEXT UNIQUE NOT NULL,
  type vehicle_type NOT NULL,
  status vehicle_status DEFAULT 'active',
  fuel_type fuel_type,
  year INTEGER,
  color TEXT,
  vin TEXT,
  insurance_expiry DATE,
  notes TEXT,
  is_escort_assigned BOOLEAN DEFAULT false,
  escort_trip_id UUID,
  escort_assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vehicle_images table
CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT,
  license_number TEXT UNIQUE NOT NULL,
  license_type TEXT,
  license_expiry DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  is_vip BOOLEAN DEFAULT false,
  avatar_url TEXT,
  document_url TEXT,
  airport_id_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fuel_logs table
CREATE TABLE IF NOT EXISTS public.fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL,
  date DATE NOT NULL,
  fuel_type fuel_type NOT NULL,
  volume DECIMAL(8,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  mileage INTEGER DEFAULT 0,
  notes TEXT,
  previous_mileage INTEGER,
  current_mileage INTEGER,
  fuel_management_id UUID,
  price_per_liter DECIMAL(8,4),
  filled_by TEXT,
  tank_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create fuel_tanks table
CREATE TABLE IF NOT EXISTS public.fuel_tanks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel')),
  capacity NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create tank_fills table
CREATE TABLE IF NOT EXISTS public.tank_fills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id UUID REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  fill_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  supplier TEXT,
  notes TEXT,
  cost_per_liter NUMERIC,
  total_cost NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. OPERATIONS TABLES
-- =====================================================

-- Create service_type enum
CREATE TYPE service_type AS ENUM (
  'airport_pickup',
  'airport_dropoff',
  'full_day',
  'half_day',
  'one_way_transfer',
  'round_trip',
  'security_escort'
);

-- Create trip_status enum
CREATE TYPE trip_status AS ENUM (
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
);

-- Create clients table
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('organization', 'individual')),
  description TEXT,
  website TEXT,
  address TEXT,
  contact TEXT,
  email TEXT,
  phone TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  has_active_contract BOOLEAN DEFAULT false
);

-- Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id),
  driver_id UUID REFERENCES public.drivers(id),
  date DATE NOT NULL,
  time TEXT,
  return_time TEXT,
  actual_pickup_time TIMESTAMPTZ,
  actual_dropoff_time TIMESTAMPTZ,
  service_type service_type,
  status trip_status DEFAULT 'scheduled',
  amount DECIMAL(10,2) NOT NULL,
  pickup_location TEXT,
  dropoff_location TEXT,
  notes TEXT,
  invoice_id UUID,
  airline TEXT,
  flight_number TEXT,
  terminal TEXT,
  is_recurring BOOLEAN DEFAULT false,
  passengers TEXT[],
  log_sheet_url TEXT,
  vehicle_type vehicle_type,
  soft_skin_count INTEGER,
  armoured_count INTEGER,
  assigned_vehicle_ids UUID[],
  assigned_driver_ids UUID[],
  passport_documents JSONB,
  invitation_documents JSONB,
  has_security_escort BOOLEAN DEFAULT false,
  escort_count INTEGER DEFAULT 0,
  escort_vehicle_ids UUID[],
  escort_status TEXT DEFAULT 'not_assigned' CHECK (escort_status IN ('not_assigned', 'partially_assigned', 'fully_assigned')),
  escort_assigned_at TIMESTAMPTZ,
  stops TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create invitation_letters table
CREATE TABLE IF NOT EXISTS public.invitation_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_number TEXT NOT NULL,
  date DATE NOT NULL,
  company_name TEXT NOT NULL,
  company_address TEXT,
  company_phone TEXT,
  company_email TEXT,
  guest_name TEXT NOT NULL,
  nationality TEXT,
  organization TEXT,
  passport_number TEXT,
  passport_expiry_date DATE,
  purpose_of_visit TEXT,
  subject TEXT DEFAULT 'Official Invitation for Business Visit',
  visit_date DATE,
  duration_of_stay TEXT,
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. FINANCE TABLES
-- =====================================================

-- Create invoice_status enum
CREATE TYPE invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- Create payment_method enum
CREATE TYPE payment_method AS ENUM (
  'cash',
  'bank_transfer',
  'credit_card',
  'mobile_money',
  'cheque',
  'other'
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  due_date DATE NOT NULL,
  status invoice_status DEFAULT 'draft',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  payment_date DATE,
  payment_method payment_method,
  quotation_id UUID,
  notes TEXT,
  vat_percentage DECIMAL(5,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quotation_status enum
CREATE TYPE quotation_status AS ENUM ('draft', 'sent', 'approved', 'rejected', 'expired');

-- Create quotations table
CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  valid_until DATE NOT NULL,
  status quotation_status DEFAULT 'draft',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL,
  notes TEXT,
  vat_percentage DECIMAL(5,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_number TEXT UNIQUE,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vehicle_leases table
CREATE TABLE IF NOT EXISTS public.vehicle_leases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rate DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create lease_invoices table
CREATE TABLE IF NOT EXISTS public.lease_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id UUID REFERENCES public.vehicle_leases(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'generated' CHECK (status IN ('generated', 'sent', 'paid', 'overdue')),
  auto_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lease_id, billing_period_start, billing_period_end)
);

-- Create lease_invoice_details view
CREATE OR REPLACE VIEW public.lease_invoice_details AS
SELECT 
  li.id,
  li.lease_id,
  li.invoice_id,
  li.billing_period_start,
  li.billing_period_end,
  li.amount,
  li.status,
  li.auto_generated,
  li.created_at,
  li.updated_at,
  vl.client_id,
  vl.vehicle_id,
  vl.monthly_rate,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone,
  c.address as client_address,
  v.make,
  v.model,
  v.registration,
  i.date as invoice_date,
  i.due_date as invoice_due_date
FROM public.lease_invoices li
JOIN public.vehicle_leases vl ON li.lease_id = vl.id
JOIN public.clients c ON vl.client_id = c.id
JOIN public.vehicles v ON vl.vehicle_id = v.id
JOIN public.invoices i ON li.invoice_id = i.id;

-- =====================================================
-- 5. MAINTENANCE AND INSPECTION TABLES
-- =====================================================

-- Create maintenance table
CREATE TABLE IF NOT EXISTS public.maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  maintenance_type TEXT NOT NULL,
  description TEXT,
  cost DECIMAL(10,2),
  date_performed DATE NOT NULL,
  next_due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create spare_parts table
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  part_number TEXT UNIQUE,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  unit_cost DECIMAL(10,2),
  supplier TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vehicle_inspections table
CREATE TABLE IF NOT EXISTS public.vehicle_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  inspection_date DATE NOT NULL,
  inspector_name TEXT,
  inspection_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('passed', 'failed', 'pending')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create vehicle_incident_reports table
CREATE TABLE IF NOT EXISTS public.vehicle_incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE,
  incident_date DATE NOT NULL,
  incident_time TIME,
  location TEXT,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  reported_by TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  images JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_tanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tank_fills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_leases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lease_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_incident_reports ENABLE ROW LEVEL SECURITY;

-- Note: RLS cannot be enabled on views, only on tables

-- =====================================================
-- 7. CREATE BASIC POLICIES
-- =====================================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Roles policies
CREATE POLICY "Authenticated users can view roles" ON public.roles
  FOR SELECT USING (auth.role() = 'authenticated');

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can manage all user roles" ON public.user_roles
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

-- Vehicles policies
CREATE POLICY "Authenticated users can view vehicles" ON public.vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage vehicles" ON public.vehicles
  FOR ALL USING (auth.role() = 'authenticated');

-- Vehicle images policies
CREATE POLICY "Authenticated users can manage vehicle images" ON public.vehicle_images
  FOR ALL USING (auth.role() = 'authenticated');

-- Drivers policies
CREATE POLICY "Authenticated users can manage drivers" ON public.drivers
  FOR ALL USING (auth.role() = 'authenticated');

-- Fuel logs policies
CREATE POLICY "Authenticated users can manage fuel logs" ON public.fuel_logs
  FOR ALL USING (auth.role() = 'authenticated');

-- Fuel tanks policies
CREATE POLICY "Authenticated users can manage fuel tanks" ON public.fuel_tanks
  FOR ALL USING (auth.role() = 'authenticated');

-- Tank fills policies
CREATE POLICY "Authenticated users can manage tank fills" ON public.tank_fills
  FOR ALL USING (auth.role() = 'authenticated');

-- Clients policies
CREATE POLICY "Authenticated users can manage clients" ON public.clients
  FOR ALL USING (auth.role() = 'authenticated');

-- Trips policies
CREATE POLICY "Authenticated users can manage trips" ON public.trips
  FOR ALL USING (auth.role() = 'authenticated');

-- Invitation letters policies
CREATE POLICY "Users can manage own invitation letters" ON public.invitation_letters
  FOR ALL USING (auth.uid() = generated_by);

-- Invoices policies
CREATE POLICY "Authenticated users can manage invoices" ON public.invoices
  FOR ALL USING (auth.role() = 'authenticated');

-- Quotations policies
CREATE POLICY "Authenticated users can manage quotations" ON public.quotations
  FOR ALL USING (auth.role() = 'authenticated');

-- Contracts policies
CREATE POLICY "Authenticated users can manage contracts" ON public.contracts
  FOR ALL USING (auth.role() = 'authenticated');

-- Vehicle leases policies
CREATE POLICY "Authenticated users can manage vehicle leases" ON public.vehicle_leases
  FOR ALL USING (auth.role() = 'authenticated');

-- Lease invoices policies
CREATE POLICY "Authenticated users can manage lease invoices" ON public.lease_invoices
  FOR ALL USING (auth.role() = 'authenticated');

-- Maintenance policies
CREATE POLICY "Authenticated users can manage maintenance" ON public.maintenance
  FOR ALL USING (auth.role() = 'authenticated');

-- Spare parts policies
CREATE POLICY "Authenticated users can manage spare parts" ON public.spare_parts
  FOR ALL USING (auth.role() = 'authenticated');

-- Vehicle inspections policies
CREATE POLICY "Authenticated users can manage vehicle inspections" ON public.vehicle_inspections
  FOR ALL USING (auth.role() = 'authenticated');

-- Vehicle incident reports policies
CREATE POLICY "Authenticated users can manage vehicle incident reports" ON public.vehicle_incident_reports
  FOR ALL USING (auth.role() = 'authenticated');

-- Note: Policies cannot be created on views, only on tables

-- =====================================================
-- 8. INSERT DEFAULT DATA
-- =====================================================

-- Insert default roles
INSERT INTO public.roles (slug, name, description) VALUES
  ('super_admin', 'Super Administrator', 'Full system access and administration'),
  ('fleet_manager', 'Fleet Manager', 'Manage vehicles and drivers'),
  ('operations_manager', 'Operations Manager', 'Manage trips and operations'),
  ('finance_manager', 'Finance Manager', 'Manage finances and invoices')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 9. CREATE TRIGGERS
-- =====================================================

-- Create trigger function to handle new user creation
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

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Vehicle indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON public.vehicles(registration);

-- Trip indexes
CREATE INDEX IF NOT EXISTS idx_trips_client_id ON public.trips(client_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON public.trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);

-- Invoice indexes
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);

-- Fuel log indexes
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON public.fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON public.fuel_logs(date);

-- Driver indexes
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_number ON public.drivers(license_number);

-- Client indexes
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Grant permissions on views
GRANT ALL ON public.vw_user_roles TO anon, authenticated, service_role;
GRANT ALL ON public.lease_invoice_details TO anon, authenticated, service_role;

-- Set default privileges
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

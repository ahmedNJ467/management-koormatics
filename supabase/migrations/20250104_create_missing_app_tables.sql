-- Create missing tables that the application is trying to access
-- This migration creates tables referenced in the frontend hooks

-- =====================================================
-- 1. ALERTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  resolved BOOLEAN DEFAULT false,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. PAGE ACCESS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_path TEXT NOT NULL,
  role_slug TEXT NOT NULL,
  access_level TEXT NOT NULL CHECK (access_level IN ('read', 'write', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page_path, role_slug)
);

-- =====================================================
-- 3. USER SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  notifications JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sms": false
  }'::jsonb,
  dashboard_refresh_interval INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- 4. SYSTEM SETTINGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. API KEYS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  key_value TEXT UNIQUE NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. ACTIVITY LOG TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 8. CREATE BASIC POLICIES
-- =====================================================

-- Alerts policies
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage alerts" ON public.alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

-- Page access policies
CREATE POLICY "Authenticated users can view page access" ON public.page_access
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage page access" ON public.page_access
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

-- User settings policies
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- System settings policies
CREATE POLICY "Super admins can manage system settings" ON public.system_settings
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

-- API keys policies
CREATE POLICY "Super admins can manage API keys" ON public.api_keys
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

-- Activity log policies
CREATE POLICY "Users can view own activity" ON public.activity_log
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all activity" ON public.activity_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

-- =====================================================
-- 9. INSERT DEFAULT DATA
-- =====================================================

-- Insert default page access rules
INSERT INTO public.page_access (page_path, role_slug, access_level) VALUES
  ('/dashboard', 'super_admin', 'admin'),
  ('/dashboard', 'fleet_manager', 'read'),
  ('/dashboard', 'operations_manager', 'read'),
  ('/dashboard', 'finance_manager', 'read'),
  ('/vehicles', 'super_admin', 'admin'),
  ('/vehicles', 'fleet_manager', 'admin'),
  ('/vehicles', 'operations_manager', 'read'),
  ('/drivers', 'super_admin', 'admin'),
  ('/drivers', 'fleet_manager', 'admin'),
  ('/drivers', 'operations_manager', 'read'),
  ('/trips', 'super_admin', 'admin'),
  ('/trips', 'operations_manager', 'admin'),
  ('/trips', 'fleet_manager', 'read'),
  ('/clients', 'super_admin', 'admin'),
  ('/clients', 'operations_manager', 'admin'),
  ('/clients', 'fleet_manager', 'read'),
  ('/invoices', 'super_admin', 'admin'),
  ('/invoices', 'finance_manager', 'admin'),
  ('/invoices', 'operations_manager', 'read'),
  ('/settings', 'super_admin', 'admin')
ON CONFLICT (page_path, role_slug) DO NOTHING;

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('app_name', '"Koormatics Management System"', 'Application name'),
  ('app_version', '"1.0.0"', 'Application version'),
  ('maintenance_mode', 'false', 'Maintenance mode status'),
  ('max_file_size', '10485760', 'Maximum file upload size in bytes'),
  ('allowed_file_types', '["jpg", "jpeg", "png", "pdf", "doc", "docx"]', 'Allowed file types for uploads')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 10. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Alerts indexes
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_date ON public.alerts(date);

-- Page access indexes
CREATE INDEX IF NOT EXISTS idx_page_access_role ON public.page_access(role_slug);
CREATE INDEX IF NOT EXISTS idx_page_access_path ON public.page_access(page_path);

-- User settings indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Activity log indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON public.activity_log(action);

-- =====================================================
-- 11. GRANT PERMISSIONS
-- =====================================================

-- Grant permissions on tables
GRANT ALL ON public.alerts TO anon, authenticated, service_role;
GRANT ALL ON public.page_access TO anon, authenticated, service_role;
GRANT ALL ON public.user_settings TO anon, authenticated, service_role;
GRANT ALL ON public.system_settings TO anon, authenticated, service_role;
GRANT ALL ON public.api_keys TO anon, authenticated, service_role;
GRANT ALL ON public.activity_log TO anon, authenticated, service_role;

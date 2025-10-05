-- Fix alerts table structure completely
-- This migration ensures the alerts table has all required columns

-- First, let's recreate the alerts table with the correct structure
DROP TABLE IF EXISTS public.alerts CASCADE;

CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'warning', 'error', 'success')),
  resolved BOOLEAN DEFAULT false,
  date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Super admins can manage alerts" ON public.alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role_slug = 'super_admin'));

-- Create indexes
CREATE INDEX idx_alerts_resolved ON public.alerts(resolved);
CREATE INDEX idx_alerts_date ON public.alerts(date);
CREATE INDEX idx_alerts_type ON public.alerts(type);

-- Grant permissions
GRANT ALL ON public.alerts TO anon, authenticated, service_role;

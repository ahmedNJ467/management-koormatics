-- Fix user access by setting up roles and permissions
-- Run this script in your Supabase SQL editor

BEGIN;

-- 1. Insert basic roles if they don't exist
INSERT INTO public.roles (slug, name) VALUES 
  ('super_admin', 'Super Administrator'),
  ('fleet_manager', 'Fleet Manager'),
  ('operations_manager', 'Operations Manager'),
  ('finance_manager', 'Finance Manager')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert basic pages if they don't exist
INSERT INTO public.pages (id, label) VALUES 
  ('dashboard', 'Dashboard'),
  ('vehicles', 'Vehicles'),
  ('drivers', 'Drivers'),
  ('trips', 'Trips'),
  ('clients', 'Clients'),
  ('maintenance', 'Maintenance'),
  ('fuel-logs', 'Fuel Logs'),
  ('reports', 'Reports'),
  ('settings', 'Settings'),
  ('profile', 'Profile'),
  ('quotations', 'Quotations'),
  ('invoices', 'Invoices'),
  ('spare-parts', 'Spare Parts'),
  ('contracts', 'Contracts'),
  ('alerts', 'Alerts'),
  ('trip-analytics', 'Trip Analytics'),
  ('cost-analytics', 'Cost Analytics'),
  ('combined-analytics', 'Combined Analytics'),
  ('dispatch', 'Dispatch'),
  ('security-escorts', 'Security Escorts'),
  ('invitation-letter', 'Invitation Letter'),
  ('vehicle-inspections', 'Vehicle Inspections'),
  ('vehicle-incident-reports', 'Vehicle Incident Reports'),
  ('vehicle-leasing', 'Vehicle Leasing'),
  ('trip-finance', 'Trip Finance')
ON CONFLICT (id) DO NOTHING;

-- 3. Set up role-page access (super_admin gets access to everything)
INSERT INTO public.role_page_access (role_slug, page_id)
SELECT 'super_admin', id FROM public.pages
ON CONFLICT (role_slug, page_id) DO NOTHING;

-- Fleet manager gets access to fleet-related pages
INSERT INTO public.role_page_access (role_slug, page_id) VALUES 
  ('fleet_manager', 'dashboard'),
  ('fleet_manager', 'vehicles'),
  ('fleet_manager', 'drivers'),
  ('fleet_manager', 'trips'),
  ('fleet_manager', 'maintenance'),
  ('fleet_manager', 'fuel-logs'),
  ('fleet_manager', 'reports'),
  ('fleet_manager', 'profile'),
  ('fleet_manager', 'trip-analytics'),
  ('fleet_manager', 'vehicle-inspections'),
  ('fleet_manager', 'vehicle-incident-reports')
ON CONFLICT (role_slug, page_id) DO NOTHING;

-- Operations manager gets access to operations-related pages
INSERT INTO public.role_page_access (role_slug, page_id) VALUES 
  ('operations_manager', 'dashboard'),
  ('operations_manager', 'trips'),
  ('operations_manager', 'clients'),
  ('operations_manager', 'dispatch'),
  ('operations_manager', 'security-escorts'),
  ('operations_manager', 'reports'),
  ('operations_manager', 'profile'),
  ('operations_manager', 'trip-analytics')
ON CONFLICT (role_slug, page_id) DO NOTHING;

-- Finance manager gets access to finance-related pages
INSERT INTO public.role_page_access (role_slug, page_id) VALUES 
  ('finance_manager', 'dashboard'),
  ('finance_manager', 'reports'),
  ('finance_manager', 'quotations'),
  ('finance_manager', 'invoices'),
  ('finance_manager', 'contracts'),
  ('finance_manager', 'cost-analytics'),
  ('finance_manager', 'combined-analytics'),
  ('finance_manager', 'trip-finance'),
  ('finance_manager', 'profile')
ON CONFLICT (role_slug, page_id) DO NOTHING;

-- 4. Get your user ID (replace 'your-email@example.com' with your actual email)
-- You can find your user ID in the auth.users table or from the browser console
-- For now, we'll create a placeholder that you need to update

-- Option A: If you know your user ID, uncomment and update this line:
-- INSERT INTO public.user_roles (user_id, role_slug) VALUES 
--   ('your-user-id-here', 'super_admin')
-- ON CONFLICT (user_id, role_slug) DO NOTHING;

-- Option B: If you know your email, use this (replace with your actual email):
-- INSERT INTO public.user_roles (user_id, role_slug)
-- SELECT au.id, 'super_admin'
-- FROM auth.users au
-- WHERE au.email = 'your-email@example.com'
-- ON CONFLICT (user_id, role_slug) DO NOTHING;

COMMIT;

-- 5. Verify the setup
SELECT 'Roles created:' as info, count(*) as count FROM public.roles
UNION ALL
SELECT 'Pages created:', count(*) FROM public.pages
UNION ALL
SELECT 'Role-page access rules:', count(*) FROM public.role_page_access;

-- 6. Check if you have any users with roles
SELECT 'Users with roles:', count(*) FROM public.user_roles;

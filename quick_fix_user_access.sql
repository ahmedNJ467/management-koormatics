-- Quick fix for user access - run this in Supabase SQL editor

-- 1. First, let's see what users exist and their emails
SELECT id, email, created_at FROM auth.users ORDER BY created_at DESC LIMIT 5;

-- 2. Insert basic roles if they don't exist
INSERT INTO public.roles (slug, name) VALUES 
  ('super_admin', 'Super Administrator'),
  ('fleet_manager', 'Fleet Manager'),
  ('operations_manager', 'Operations Manager'),
  ('finance_manager', 'Finance Manager')
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert basic pages if they don't exist
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

-- 4. Set up role-page access (super_admin gets access to everything)
INSERT INTO public.role_page_access (role_slug, page_id)
SELECT 'super_admin', id FROM public.pages
ON CONFLICT (role_slug, page_id) DO NOTHING;

-- 5. Assign super_admin role to the most recent user (usually the current user)
-- This will give you full access to everything
INSERT INTO public.user_roles (user_id, role_slug)
SELECT au.id, 'super_admin'
FROM auth.users au
WHERE au.id NOT IN (SELECT user_id FROM public.user_roles)
ORDER BY au.created_at DESC
LIMIT 1
ON CONFLICT (user_id, role_slug) DO NOTHING;

-- 6. Verify the setup
SELECT 'Current user roles:' as info, count(*) as count FROM public.user_roles
UNION ALL
SELECT 'Roles available:', count(*) FROM public.roles
UNION ALL
SELECT 'Pages available:', count(*) FROM public.pages
UNION ALL
SELECT 'Access rules:', count(*) FROM public.role_page_access;

-- 7. Show your current user and their roles
SELECT 
  au.email,
  ur.role_slug,
  r.name as role_name
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
LEFT JOIN public.roles r ON ur.role_slug = r.slug
ORDER BY au.created_at DESC
LIMIT 3;

-- Pages and Role-based access mapping

-- 1. Pages master table
create table if not exists pages (
  id text primary key, -- e.g. '/vehicles'
  label text not null,
  created_at timestamptz default now()
);

-- 2. Mapping table role -> page
create table if not exists role_page_access (
  role_slug text references roles(slug) on delete cascade,
  page_id   text references pages(id) on delete cascade,
  primary key (role_slug, page_id)
);

-- 3. Seed common pages (skip if already present)
insert into pages (id, label)
select * from (values
  ('*', 'All Pages'),
  ('/dashboard', 'Dashboard'),
  ('/vehicles', 'Vehicles'),
  ('/drivers', 'Drivers'),
  ('/trips', 'Trips'),
  ('/clients', 'Clients'),
  ('/maintenance', 'Maintenance'),
  ('/fuel-logs', 'Fuel Logs'),
  ('/reports', 'Reports'),
  ('/settings', 'Settings'),
  ('/settings/security', 'Security & Access'),
  ('/settings/company', 'Company Settings'),
  ('/settings/regional', 'Regional Settings'),
  ('/settings/notifications', 'Notification Settings'),
  ('/profile', 'Profile'),
  ('/quotations', 'Quotations'),
  ('/invoices', 'Invoices'),
  ('/spare-parts', 'Spare Parts'),
  ('/contracts', 'Contracts'),
  ('/alerts', 'Alerts'),
  ('/trip-analytics', 'Trip Analytics'),
  ('/cost-analytics', 'Cost Analytics'),
  ('/combined-analytics', 'Combined Analytics'),
  ('/dispatch', 'Dispatch'),
  ('/invitation-letter', 'Invitation Letter'),
  ('/vehicle-inspections', 'Vehicle Inspections'),
  ('/vehicle-incident-reports', 'Incident Reports'),
  ('/vehicle-leasing', 'Vehicle Leasing')
) as p(id,label)
where not exists (select 1 from pages where id = p.id);

-- 4. Seed default access rules if none exist
-- super_admin -> *
insert into role_page_access (role_slug, page_id)
select 'super_admin', '*'
where not exists (select 1 from role_page_access where role_slug='super_admin' and page_id='*');

-- manager basic pages
insert into role_page_access (role_slug, page_id)
select 'manager', id from pages where id in ('/dashboard','/reports','/vehicles','/drivers','/clients')
  and not exists (select 1 from role_page_access where role_slug='manager' and page_id = pages.id);

-- staff
insert into role_page_access (role_slug, page_id)
select 'staff', id from pages where id in ('/dashboard','/trips','/vehicles')
  and not exists (select 1 from role_page_access where role_slug='staff' and page_id = pages.id);

-- viewer
insert into role_page_access (role_slug, page_id)
select 'viewer', id from pages where id = '/dashboard'
  and not exists (select 1 from role_page_access where role_slug='viewer' and page_id = '/dashboard');

-- 5. Create view returning pages per user
create or replace view public.vw_user_pages as
select ur.user_id,
  coalesce(array_agg(distinct case when rpa.page_id='*' then p_all.id else rpa.page_id end) filter (where rpa.page_id is not null), '{}') as pages
from user_roles ur
left join role_page_access rpa on rpa.role_slug = ur.role_slug
left join pages p_all on p_all.id = p_all.id -- dummy join for '*' replacement
group by ur.user_id;

-- Enable RLS on view and allow authenticated select
alter table public.vw_user_pages enable row level security;
create policy "Allow authenticated select" on public.vw_user_pages for select using (auth.role() = 'authenticated'); 
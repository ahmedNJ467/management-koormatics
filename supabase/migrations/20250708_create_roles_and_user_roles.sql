-- Create roles table
create table if not exists roles (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- Seed default roles if table empty
insert into roles (slug, name)
select * from (values
  ('super_admin', 'Super Admin'),
  ('manager', 'Manager'),
  ('staff', 'Staff'),
  ('viewer', 'Viewer')
) as r(slug, name)
where not exists (select 1 from roles);

-- Create user_roles join table (many-to-many)
create table if not exists user_roles (
  user_id uuid references auth.users(id) on delete cascade,
  role_slug text references roles(slug) on delete cascade,
  granted_at timestamptz default now(),
  primary key (user_id, role_slug)
);

-- Create view combining auth.users and their roles for easy querying
create or replace view public.vw_user_roles as
select
  u.id                         as user_id,
  u.email,
  u.raw_user_meta_data ->> 'full_name' as full_name,
  u.created_at,
  coalesce(array_agg(ur.role_slug) filter (where ur.role_slug is not null), '{}') as roles
from auth.users u
left join user_roles ur on ur.user_id = u.id
group by u.id;

-- Grant select on the view to authenticated users
alter table public.vw_user_roles enable row level security;

create policy "Authenticated view user roles" on public.vw_user_roles
for select using (auth.role() = 'authenticated'); 
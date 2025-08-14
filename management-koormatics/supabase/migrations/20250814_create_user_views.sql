-- Create consistent views for roles and page access, and ensure grants
-- Idempotent and safe to re-run

begin;

-- 1) Ensure base tables exist (roles, user_roles, pages, role_page_access)
--    These should already exist from prior migrations; create minimal stubs if missing
create table if not exists public.roles (
  slug text primary key,
  name text not null
);

create table if not exists public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role_slug text not null references public.roles(slug) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, role_slug)
);

create table if not exists public.pages (
  id text primary key,
  label text not null
);

create table if not exists public.role_page_access (
  role_slug text not null references public.roles(slug) on delete cascade,
  page_id text not null references public.pages(id) on delete cascade,
  primary key (role_slug, page_id)
);

-- 2) View of user -> roles
create or replace view public.vw_user_roles
security definer
as
select ur.user_id,
       array_agg(ur.role_slug order by ur.role_slug) as roles
from public.user_roles ur
group by ur.user_id;

revoke all on public.vw_user_roles from public;
grant select on public.vw_user_roles to anon, authenticated;

-- 3) View of user -> allowed pages (based on roles)
create or replace view public.vw_user_pages
security definer
as
select ur.user_id,
       coalesce(array_agg(distinct rpa.page_id) filter (where rpa.page_id is not null), '{}') as pages
from public.user_roles ur
left join public.role_page_access rpa on rpa.role_slug = ur.role_slug
group by ur.user_id;

revoke all on public.vw_user_pages from public;
grant select on public.vw_user_pages to anon, authenticated;

commit;



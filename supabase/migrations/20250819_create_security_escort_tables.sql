-- Security Escorts schema: guards and teams (requires schema: public)
-- Creates tables if they do not exist; enables RLS and basic authenticated policies

-- security_guards: individual guard registry
create table if not exists public.security_guards (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  id_number text,
  rank text,
  status text default 'active',
  notes text,
  created_at timestamptz not null default now()
);

alter table public.security_guards enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'security_guards' and policyname = 'sg_select_auth'
  ) then
    create policy sg_select_auth on public.security_guards
      for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'security_guards' and policyname = 'sg_insert_auth'
  ) then
    create policy sg_insert_auth on public.security_guards
      for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'security_guards' and policyname = 'sg_update_auth'
  ) then
    create policy sg_update_auth on public.security_guards
      for update to authenticated using (true) with check (true);
  end if;
end $$;

-- escort_teams: team of exactly 4 guards + one vehicle
create table if not exists public.escort_teams (
  id uuid primary key default gen_random_uuid(),
  team_name text not null,
  guard_ids uuid[] not null,
  vehicle_id uuid references public.vehicles(id) on update cascade on delete set null,
  created_at timestamptz not null default now(),
  constraint escort_team_guard_count check (array_length(guard_ids, 1) = 4)
);

create index if not exists escort_teams_vehicle_id_idx on public.escort_teams(vehicle_id);

alter table public.escort_teams enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'escort_teams' and policyname = 'et_select_auth'
  ) then
    create policy et_select_auth on public.escort_teams
      for select to authenticated using (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'escort_teams' and policyname = 'et_insert_auth'
  ) then
    create policy et_insert_auth on public.escort_teams
      for insert to authenticated with check (true);
  end if;
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'escort_teams' and policyname = 'et_update_auth'
  ) then
    create policy et_update_auth on public.escort_teams
      for update to authenticated using (true) with check (true);
  end if;
end $$;



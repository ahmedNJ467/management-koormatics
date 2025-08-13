-- Vehicle incident images table
-- Stores references to images uploaded to Supabase Storage for each incident

create table if not exists public.vehicle_incident_images (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.vehicle_incident_reports(id) on delete cascade,
  image_url text not null,
  name text,
  created_at timestamptz default now()
);

create index if not exists idx_vehicle_incident_images_incident_id
  on public.vehicle_incident_images(incident_id);

comment on table public.vehicle_incident_images is 'Image references linked to vehicle incident reports';
comment on column public.vehicle_incident_images.image_url is 'Public URL of the stored image in the images bucket';

-- Enable RLS and basic open policies similar to vehicle_incident_reports
alter table public.vehicle_incident_images enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vehicle_incident_images' and policyname = 'Allow select on incident images'
  ) then
    create policy "Allow select on incident images" on public.vehicle_incident_images for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vehicle_incident_images' and policyname = 'Allow insert on incident images'
  ) then
    create policy "Allow insert on incident images" on public.vehicle_incident_images for insert with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'vehicle_incident_images' and policyname = 'Allow delete on incident images'
  ) then
    create policy "Allow delete on incident images" on public.vehicle_incident_images for delete using (true);
  end if;
end $$;



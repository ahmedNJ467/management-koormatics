-- Fix critical security issues from linter

-- 1. Fix Security Definer Views - Remove SECURITY DEFINER from views
DROP VIEW IF EXISTS public.vw_user_roles;
DROP VIEW IF EXISTS public.vw_user_pages;

-- Recreate views without SECURITY DEFINER (they will use the default SECURITY INVOKER)
CREATE VIEW public.vw_user_roles AS
SELECT 
  p.id as user_id,
  p.created_at,
  p.email,
  p.full_name,
  COALESCE(array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL), '{}') as roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
GROUP BY p.id, p.created_at, p.email, p.full_name;

CREATE VIEW public.vw_user_pages AS
SELECT 
  p.id as user_id,
  COALESCE(array_agg(DISTINCT rpa.page_id) FILTER (WHERE rpa.page_id IS NOT NULL), '{}') as pages
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
LEFT JOIN public.role_page_access rpa ON ur.role_slug = rpa.role_slug
GROUP BY p.id;

-- 2. Fix function search paths for security
CREATE OR REPLACE FUNCTION public.get_storage_dispensed(p_storage_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT COALESCE(SUM(volume), 0)::numeric
  FROM public.fuel_logs
  WHERE fuel_management_id = p_storage_id
$function$;

CREATE OR REPLACE FUNCTION public.trips_prevent_vehicle_overlap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
declare
  -- cast carrier array to text[]
  carrier_text text[] := coalesce(NEW.assigned_vehicle_ids::text[], '{}');
  -- build escort array as text[] from jsonb
  escort_text text[] := '{}';
begin
  if NEW.escort_vehicle_ids is null then
    NEW.escort_vehicle_ids := '[]'::jsonb;
  end if;

  select coalesce(array_agg(e), '{}')
    into escort_text
  from jsonb_array_elements_text(NEW.escort_vehicle_ids) e;

  -- prevent overlap: both sides are text[]
  if carrier_text && escort_text then
    raise exception
      using message = 'carrier and escort vehicles cannot overlap for the same trip',
            errcode = '23514';
  end if;

  -- normalize escort_count with has_security_escort
  if coalesce(NEW.has_security_escort, false) = false then
    NEW.escort_count := null;
  else
    if NEW.escort_count is null or NEW.escort_count < 1 then
      NEW.escort_count := greatest(1, coalesce(array_length(escort_text, 1), 1));
    end if;
  end if;

  return NEW;
end
$function$;

CREATE OR REPLACE FUNCTION public.fuel_logs_default_first_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.previous_mileage IS NULL THEN
    NEW.previous_mileage := NEW.current_mileage;
    NEW.mileage := 0;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_primary_vehicle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
begin
  /* after insert/update: if assigned_vehicle_ids is null/empty → vehicle_id = NULL
                          else vehicle_id = first element of array            */
  if (coalesce(array_length(new.assigned_vehicle_ids,1),0) = 0) then
      new.vehicle_id := null;
  else
      new.vehicle_id := new.assigned_vehicle_ids[1]::uuid;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.update_trips_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vehicle_inspections_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vehicle_leases_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_vehicle_incident_reports_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.sync_vehicle_escort_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    old_vehicle_ids JSONB;
    new_vehicle_ids JSONB;
    vehicle_id TEXT;
    vehicle_record RECORD;
BEGIN
    -- Handle UPDATE operations
    IF TG_OP = 'UPDATE' THEN
        old_vehicle_ids := COALESCE(OLD.escort_vehicle_ids, '[]'::jsonb);
        new_vehicle_ids := COALESCE(NEW.escort_vehicle_ids, '[]'::jsonb);
        
        -- Remove escort assignment from vehicles no longer assigned
        IF old_vehicle_ids IS NOT NULL THEN
            FOR vehicle_id IN SELECT jsonb_array_elements_text(old_vehicle_ids)
            LOOP
                IF NOT (new_vehicle_ids ? vehicle_id) THEN
                    -- Get the vehicle record to restore original status
                    SELECT original_status INTO vehicle_record FROM public.vehicles WHERE id = vehicle_id::uuid;
                    
                    UPDATE public.vehicles 
                    SET 
                        is_escort_assigned = false,
                        escort_trip_id = NULL,
                        escort_assigned_at = NULL,
                        status = COALESCE(vehicle_record.original_status, 'active'),
                        original_status = NULL
                    WHERE id = vehicle_id::uuid;
                END IF;
            END LOOP;
        END IF;
        
        -- Add escort assignment to newly assigned vehicles
        IF new_vehicle_ids IS NOT NULL THEN
            FOR vehicle_id IN SELECT jsonb_array_elements_text(new_vehicle_ids)
            LOOP
                IF NOT (old_vehicle_ids ? vehicle_id) THEN
                    UPDATE public.vehicles 
                    SET 
                        is_escort_assigned = true,
                        escort_trip_id = NEW.id,
                        escort_assigned_at = NEW.escort_assigned_at,
                        original_status = status,  -- Store current status before changing
                        status = 'assigned'        -- Change status to assigned
                    WHERE id = vehicle_id::uuid;
                END IF;
            END LOOP;
        END IF;
        
        RETURN NEW;
    END IF;
    
    -- Handle DELETE operations
    IF TG_OP = 'DELETE' THEN
        -- Remove escort assignment from all vehicles assigned to this trip
        IF OLD.escort_vehicle_ids IS NOT NULL THEN
            FOR vehicle_id IN SELECT jsonb_array_elements_text(OLD.escort_vehicle_ids)
            LOOP
                -- Get the vehicle record to restore original status
                SELECT original_status INTO vehicle_record FROM public.vehicles WHERE id = vehicle_id::uuid;
                
                UPDATE public.vehicles 
                SET 
                    is_escort_assigned = false,
                    escort_trip_id = NULL,
                    escort_assigned_at = NULL,
                    status = COALESCE(vehicle_record.original_status, 'active'),
                    original_status = NULL
                WHERE id = vehicle_id::uuid;
            END LOOP;
        END IF;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$function$;
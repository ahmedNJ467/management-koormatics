

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."client_type" AS ENUM (
    'organization',
    'individual'
);


ALTER TYPE "public"."client_type" OWNER TO "postgres";


CREATE TYPE "public"."condition_status" AS ENUM (
    'good',
    'fair',
    'poor'
);


ALTER TYPE "public"."condition_status" OWNER TO "postgres";


CREATE TYPE "public"."driver_status" AS ENUM (
    'active',
    'inactive',
    'on_leave'
);


ALTER TYPE "public"."driver_status" OWNER TO "postgres";


CREATE TYPE "public"."fluid_level" AS ENUM (
    'good',
    'low',
    'needs_change',
    'needs_refill'
);


ALTER TYPE "public"."fluid_level" OWNER TO "postgres";


CREATE TYPE "public"."fuel_type" AS ENUM (
    'petrol',
    'diesel',
    'hybrid',
    'electric'
);


ALTER TYPE "public"."fuel_type" OWNER TO "postgres";


CREATE TYPE "public"."fuel_type_enum" AS ENUM (
    'petrol',
    'diesel',
    'cng'
);


ALTER TYPE "public"."fuel_type_enum" OWNER TO "postgres";


CREATE TYPE "public"."fuel_type_enum_strict" AS ENUM (
    'petrol',
    'diesel'
);


ALTER TYPE "public"."fuel_type_enum_strict" OWNER TO "postgres";


CREATE TYPE "public"."incident_severity" AS ENUM (
    'minor',
    'moderate',
    'severe',
    'critical'
);


ALTER TYPE "public"."incident_severity" OWNER TO "postgres";


CREATE TYPE "public"."incident_status" AS ENUM (
    'reported',
    'investigating',
    'resolved',
    'closed'
);


ALTER TYPE "public"."incident_status" OWNER TO "postgres";


CREATE TYPE "public"."incident_type" AS ENUM (
    'accident',
    'theft',
    'vandalism',
    'breakdown',
    'traffic_violation',
    'other'
);


ALTER TYPE "public"."incident_type" OWNER TO "postgres";


CREATE TYPE "public"."inspection_status" AS ENUM (
    'pass',
    'fail',
    'conditional'
);


ALTER TYPE "public"."inspection_status" OWNER TO "postgres";


CREATE TYPE "public"."invoice_status" AS ENUM (
    'draft',
    'sent',
    'paid',
    'overdue',
    'cancelled'
);


ALTER TYPE "public"."invoice_status" OWNER TO "postgres";


CREATE TYPE "public"."lease_status" AS ENUM (
    'active',
    'pending',
    'expired',
    'terminated',
    'upcoming'
);


ALTER TYPE "public"."lease_status" OWNER TO "postgres";


CREATE TYPE "public"."maintenance_status" AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."maintenance_status" OWNER TO "postgres";


CREATE TYPE "public"."payment_status" AS ENUM (
    'current',
    'overdue',
    'partial',
    'paid_ahead'
);


ALTER TYPE "public"."payment_status" OWNER TO "postgres";


CREATE TYPE "public"."quotation_status" AS ENUM (
    'draft',
    'sent',
    'approved',
    'rejected',
    'expired'
);


ALTER TYPE "public"."quotation_status" OWNER TO "postgres";


CREATE TYPE "public"."service_type" AS ENUM (
    'airport_pickup',
    'airport_dropoff',
    'full_day',
    'one_way_transfer',
    'round_trip',
    'security_escort',
    'convoy'
);


ALTER TYPE "public"."service_type" OWNER TO "postgres";


CREATE TYPE "public"."trip_status" AS ENUM (
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);


ALTER TYPE "public"."trip_status" OWNER TO "postgres";


CREATE TYPE "public"."trip_type" AS ENUM (
    'airport_pickup',
    'airport_dropoff',
    'one_way_transfer',
    'round_trip',
    'full_day',
    'half_day'
);


ALTER TYPE "public"."trip_type" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_status" AS ENUM (
    'active',
    'in_service',
    'inactive',
    'assigned',
    'available'
);


ALTER TYPE "public"."vehicle_status" OWNER TO "postgres";


CREATE TYPE "public"."vehicle_type" AS ENUM (
    'armoured',
    'soft_skin'
);


ALTER TYPE "public"."vehicle_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_table_to_publication"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  table_exists boolean;
BEGIN
  -- Check if the table is already in the publication
  SELECT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = table_name
  ) INTO table_exists;
  
  -- Add table to publication if not already added
  IF NOT table_exists THEN
    EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', table_name);
  END IF;
END;
$$;


ALTER FUNCTION "public"."add_table_to_publication"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_replica_identity"("table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  has_replica_identity_full boolean;
BEGIN
  SELECT relreplident = 'f' INTO has_replica_identity_full
  FROM pg_class
  WHERE oid = (quote_ident(table_name)::regclass);
  
  RETURN has_replica_identity_full;
END;
$$;


ALTER FUNCTION "public"."check_replica_identity"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_client_members_table"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if table already exists
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'client_members'
  ) THEN
    -- Create the table
    CREATE TABLE public.client_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      role TEXT,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );

    -- Add RLS policies
    ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

    -- Add trigger for updated_at
    CREATE TRIGGER update_client_members_updated_at
    BEFORE UPDATE ON public.client_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    RAISE NOTICE 'client_members table created successfully';
  ELSE
    RAISE NOTICE 'client_members table already exists';
  END IF;
END;
$$;


ALTER FUNCTION "public"."create_client_members_table"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enable_realtime_for_table"("table_name" "text") RETURNS boolean
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the table has REPLICA IDENTITY FULL
  IF NOT public.check_replica_identity(table_name) THEN
    PERFORM public.set_replica_identity_full(table_name);
  END IF;
  
  -- Add the table to the publication
  PERFORM public.add_table_to_publication(table_name);
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error enabling realtime for %: %', table_name, SQLERRM;
    RETURN false;
END;
$$;


ALTER FUNCTION "public"."enable_realtime_for_table"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."fuel_logs_default_first_entry"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF NEW.previous_mileage IS NULL THEN
    NEW.previous_mileage := NEW.current_mileage;
    NEW.mileage := 0;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."fuel_logs_default_first_entry"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_storage_dispensed"("p_storage_id" "uuid") RETURNS numeric
    LANGUAGE "sql" STABLE
    AS $$
  SELECT COALESCE(SUM(volume), 0)::numeric
  FROM public.fuel_logs
  WHERE fuel_management_id = p_storage_id
$$;


ALTER FUNCTION "public"."get_storage_dispensed"("p_storage_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."modify_invoices_client_id_nullable"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'invoices_client_id_fkey'
  ) THEN
    -- Drop the existing foreign key constraint
    ALTER TABLE public.invoices DROP CONSTRAINT invoices_client_id_fkey;
  END IF;
  
  -- Alter the column to be nullable
  ALTER TABLE public.invoices ALTER COLUMN client_id DROP NOT NULL;
  
  -- Add the foreign key constraint back, but with ON DELETE SET NULL
  ALTER TABLE public.invoices 
  ADD CONSTRAINT invoices_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES public.clients(id)
  ON DELETE SET NULL;
END;
$$;


ALTER FUNCTION "public"."modify_invoices_client_id_nullable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."modify_trips_client_id_nullable"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trips_client_id_fkey'
  ) THEN
    -- Drop the existing foreign key constraint
    ALTER TABLE public.trips DROP CONSTRAINT trips_client_id_fkey;
  END IF;
  
  -- Alter the column to be nullable
  ALTER TABLE public.trips ALTER COLUMN client_id DROP NOT NULL;
  
  -- Add the foreign key constraint back, but with ON DELETE SET NULL
  ALTER TABLE public.trips 
  ADD CONSTRAINT trips_client_id_fkey
  FOREIGN KEY (client_id)
  REFERENCES public.clients(id)
  ON DELETE SET NULL;
END;
$$;


ALTER FUNCTION "public"."modify_trips_client_id_nullable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_replica_identity_full"("table_name" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', table_name);
END;
$$;


ALTER FUNCTION "public"."set_replica_identity_full"("table_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_primary_vehicle"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."sync_primary_vehicle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_vehicle_escort_status"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
                    SELECT original_status INTO vehicle_record FROM vehicles WHERE id = vehicle_id::uuid;
                    
                    UPDATE vehicles 
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
                    UPDATE vehicles 
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
                SELECT original_status INTO vehicle_record FROM vehicles WHERE id = vehicle_id::uuid;
                
                UPDATE vehicles 
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
$$;


ALTER FUNCTION "public"."sync_vehicle_escort_status"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trips_prevent_vehicle_overlap"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."trips_prevent_vehicle_overlap"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_part_notes"("part_id" "uuid", "notes_value" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if the notes column exists in the spare_parts table
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'spare_parts' AND column_name = 'notes'
  ) THEN
    -- Update the notes column if it exists
    EXECUTE format('UPDATE public.spare_parts SET notes = %L WHERE id = %L', notes_value, part_id);
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_part_notes"("part_id" "uuid", "notes_value" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_trips_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_trips_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vehicle_incident_reports_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vehicle_incident_reports_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vehicle_inspections_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vehicle_inspections_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_vehicle_leases_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_vehicle_leases_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text" NOT NULL,
    "related_id" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "activities_type_check" CHECK (("type" = ANY (ARRAY['trip'::"text", 'maintenance'::"text", 'vehicle'::"text", 'driver'::"text", 'client'::"text", 'fuel'::"text", 'contract'::"text"])))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."alerts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "priority" "text" NOT NULL,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolved" boolean DEFAULT false NOT NULL,
    "type" "text" NOT NULL,
    "description" "text",
    "related_id" "text",
    "related_type" "text",
    CONSTRAINT "alerts_priority_check" CHECK (("priority" = ANY (ARRAY['high'::"text", 'medium'::"text", 'low'::"text"]))),
    CONSTRAINT "alerts_type_check" CHECK (("type" = ANY (ARRAY['maintenance'::"text", 'driver'::"text", 'fuel'::"text", 'vehicle'::"text", 'trip'::"text", 'contract'::"text"])))
);


ALTER TABLE "public"."alerts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_user_id" "uuid",
    "client_id" "uuid",
    "trip_id" "uuid",
    "service_type" "text" NOT NULL,
    "pickup_location" "text" NOT NULL,
    "dropoff_location" "text" NOT NULL,
    "pickup_date" "date" NOT NULL,
    "pickup_time" time without time zone,
    "return_date" "date",
    "return_time" time without time zone,
    "passengers" integer DEFAULT 1,
    "special_requests" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "estimated_cost" numeric,
    "confirmed_cost" numeric,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_bookings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_contacts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "position" "text",
    "email" "text",
    "phone" "text",
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_contacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "name" "text" NOT NULL,
    "role" "text",
    "email" "text",
    "phone" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "document_url" "text",
    "document_name" "text"
);


ALTER TABLE "public"."client_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."client_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid",
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text" DEFAULT 'member'::"text",
    "is_active" boolean DEFAULT true,
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."client_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "type" "public"."client_type" NOT NULL,
    "contact" "text",
    "email" "text",
    "phone" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "profile_image_url" "text",
    "documents" "jsonb" DEFAULT '[]'::"jsonb",
    "address" "text",
    "description" "text",
    "website" "text",
    "is_archived" boolean DEFAULT false
);


ALTER TABLE "public"."clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "client_name" "text" NOT NULL,
    "status" "text" NOT NULL,
    "start_date" "date" NOT NULL,
    "end_date" "date" NOT NULL,
    "contract_file" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "contract_number" character varying(20) NOT NULL,
    CONSTRAINT "contracts_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'expired'::"text", 'pending'::"text"])))
);


ALTER TABLE "public"."contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."drivers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "contact" "text",
    "license_number" "text" NOT NULL,
    "license_type" "text",
    "license_expiry" "date",
    "status" "public"."driver_status" DEFAULT 'active'::"public"."driver_status",
    "avatar_url" "text",
    "document_url" "text",
    "phone" character varying(50),
    "is_vip" boolean DEFAULT false NOT NULL,
    "airport_id_url" "text"
);


ALTER TABLE "public"."drivers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."drivers"."is_vip" IS 'Indicates if the driver is a VIP driver';



COMMENT ON COLUMN "public"."drivers"."airport_id_url" IS 'URL to the uploaded airport ID card document';



CREATE TABLE IF NOT EXISTS "public"."fuel_fills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "fuel_management_id" "uuid",
    "fill_date" "date" NOT NULL,
    "amount" numeric NOT NULL,
    "supplier" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()),
    "cost_per_liter" numeric,
    "total_cost" numeric
);


ALTER TABLE "public"."fuel_fills" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fuel_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "fuel_type" "public"."fuel_type_enum_strict" NOT NULL,
    "volume" numeric(10,2) NOT NULL,
    "cost" numeric(10,2) NOT NULL,
    "mileage" integer NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "previous_mileage" integer DEFAULT 0,
    "current_mileage" integer DEFAULT 0,
    "fuel_management_id" "uuid",
    "price_per_liter" numeric,
    CONSTRAINT "fuel_logs_cost_check" CHECK (("cost" > (0)::numeric)),
    CONSTRAINT "fuel_logs_current_ge_previous_check" CHECK ((("previous_mileage" IS NULL) OR ("current_mileage" >= "previous_mileage"))),
    CONSTRAINT "fuel_logs_mileage_check" CHECK ((("mileage" >= 0) AND ("current_mileage" >= 0) AND (("previous_mileage" IS NULL) OR ("previous_mileage" >= 0)) AND ("mileage" = GREATEST(("current_mileage" - COALESCE("previous_mileage", "current_mileage")), 0)))),
    CONSTRAINT "fuel_logs_volume_check" CHECK (("volume" > (0)::numeric))
);


ALTER TABLE "public"."fuel_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fuel_management" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "fuel_type" "public"."fuel_type_enum_strict" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"())
);


ALTER TABLE "public"."fuel_management" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."invitation_letters" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "ref_number" "text" NOT NULL,
    "letter_date" "date" NOT NULL,
    "company_name" "text" DEFAULT 'Peace Business Group'::"text" NOT NULL,
    "company_address" "text" DEFAULT 'Airport Road, Wadajir District, Mogadishu, Somalia'::"text" NOT NULL,
    "company_email" "text" DEFAULT 'reservations@peacebusinessgroup.com'::"text" NOT NULL,
    "company_phone" "text" DEFAULT '+252 61-94-94973 / +252 61-94-94974'::"text" NOT NULL,
    "visitor_name" "text" NOT NULL,
    "visitor_nationality" "text" NOT NULL,
    "visitor_organization" "text" NOT NULL,
    "visitor_passport" "text" NOT NULL,
    "passport_expiry" "date" NOT NULL,
    "purpose_of_visit" "text" NOT NULL,
    "duration_of_stay" "text" NOT NULL,
    "date_of_visit" "date" NOT NULL,
    "file_name" "text" NOT NULL,
    "pdf_url" "text",
    "generated_by" "uuid",
    "form_data" "jsonb" NOT NULL
);


ALTER TABLE "public"."invitation_letters" OWNER TO "postgres";


COMMENT ON TABLE "public"."invitation_letters" IS 'Stores invitation letter data with form information and metadata';



COMMENT ON COLUMN "public"."invitation_letters"."pdf_url" IS 'Optional URL to PDF stored in Supabase Storage bucket';



COMMENT ON COLUMN "public"."invitation_letters"."form_data" IS 'Complete form data stored as JSONB for backwards compatibility and migration';



CREATE TABLE IF NOT EXISTS "public"."invoices" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "due_date" "date" NOT NULL,
    "client_id" "uuid",
    "status" "public"."invoice_status" DEFAULT 'draft'::"public"."invoice_status" NOT NULL,
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "paid_amount" numeric DEFAULT 0 NOT NULL,
    "payment_date" "date",
    "payment_method" "text",
    "notes" "text",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "quotation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "vat_percentage" numeric,
    "discount_percentage" numeric
);


ALTER TABLE "public"."invoices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."maintenance" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "description" "text" NOT NULL,
    "cost" numeric(10,2) NOT NULL,
    "next_scheduled" "date",
    "status" "public"."maintenance_status" DEFAULT 'scheduled'::"public"."maintenance_status",
    "notes" "text",
    "service_provider" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."maintenance" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."pages" (
    "id" "text" NOT NULL,
    "label" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."quotations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "date" "date" NOT NULL,
    "client_id" "uuid" NOT NULL,
    "status" "public"."quotation_status" DEFAULT 'draft'::"public"."quotation_status" NOT NULL,
    "total_amount" numeric DEFAULT 0 NOT NULL,
    "valid_until" "date" NOT NULL,
    "notes" "text",
    "items" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "vat_percentage" numeric,
    "discount_percentage" numeric
);


ALTER TABLE "public"."quotations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_page_access" (
    "role_slug" "text" NOT NULL,
    "page_id" "text" NOT NULL
);


ALTER TABLE "public"."role_page_access" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."roles" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."spare_parts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "part_number" "text" NOT NULL,
    "category" "text" NOT NULL,
    "manufacturer" "text" NOT NULL,
    "quantity" integer DEFAULT 0 NOT NULL,
    "unit_price" numeric DEFAULT 0 NOT NULL,
    "location" "text" NOT NULL,
    "status" "text" NOT NULL,
    "min_stock_level" integer DEFAULT 5 NOT NULL,
    "compatibility" "text"[] DEFAULT '{}'::"text"[],
    "part_image" "text",
    "last_ordered" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "purchase_date" "date",
    "quantity_used" integer DEFAULT 0,
    "maintenance_id" "uuid",
    "last_used_date" "date",
    CONSTRAINT "spare_parts_status_check" CHECK (("status" = ANY (ARRAY['in_stock'::"text", 'low_stock'::"text", 'out_of_stock'::"text"])))
);


ALTER TABLE "public"."spare_parts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "driver_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "driver_rating" integer,
    CONSTRAINT "trip_assignments_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."trip_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_feedback" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid",
    "client_user_id" "uuid",
    "rating" integer,
    "driver_rating" integer,
    "vehicle_rating" integer,
    "punctuality_rating" integer,
    "comments" "text",
    "would_recommend" boolean,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "trip_feedback_driver_rating_check" CHECK ((("driver_rating" >= 1) AND ("driver_rating" <= 5))),
    CONSTRAINT "trip_feedback_punctuality_rating_check" CHECK ((("punctuality_rating" >= 1) AND ("punctuality_rating" <= 5))),
    CONSTRAINT "trip_feedback_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "trip_feedback_vehicle_rating_check" CHECK ((("vehicle_rating" >= 1) AND ("vehicle_rating" <= 5)))
);


ALTER TABLE "public"."trip_feedback" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid" NOT NULL,
    "sender_type" "text" NOT NULL,
    "sender_name" "text" NOT NULL,
    "message" "text" NOT NULL,
    "timestamp" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "attachment_url" "text",
    CONSTRAINT "trip_messages_sender_type_check" CHECK (("sender_type" = ANY (ARRAY['admin'::"text", 'driver'::"text", 'client'::"text"])))
);


ALTER TABLE "public"."trip_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trip_tracking" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trip_id" "uuid",
    "status" "text" NOT NULL,
    "location_lat" numeric,
    "location_lng" numeric,
    "location_address" "text",
    "estimated_arrival" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trip_tracking" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."trips" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_id" "uuid" NOT NULL,
    "vehicle_id" "uuid",
    "driver_id" "uuid",
    "date" "date" NOT NULL,
    "time" time without time zone,
    "return_time" time without time zone,
    "actual_pickup_time" timestamp with time zone,
    "actual_dropoff_time" timestamp with time zone,
    "service_type" "public"."trip_type" NOT NULL,
    "status" "public"."trip_status" DEFAULT 'scheduled'::"public"."trip_status",
    "amount" numeric(10,2) DEFAULT 0 NOT NULL,
    "pickup_location" "text",
    "dropoff_location" "text",
    "notes" "text",
    "special_instructions" "text",
    "invoice_id" "uuid",
    "airline" character varying(100),
    "flight_number" character varying(50),
    "terminal" character varying(50),
    "is_recurring" boolean DEFAULT false,
    "passengers" "text"[],
    "log_sheet_url" "text",
    "vehicle_type" "public"."vehicle_type",
    "passport_documents" "jsonb",
    "invitation_documents" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "has_security_escort" boolean DEFAULT false,
    "escort_count" integer DEFAULT 0,
    "escort_vehicle_ids" "jsonb" DEFAULT '[]'::"jsonb",
    "escort_status" "text" DEFAULT 'not_assigned'::"text",
    "escort_assigned_at" timestamp with time zone,
    "stops" "text"[],
    "soft_skin_count" integer DEFAULT 0,
    "armoured_count" integer DEFAULT 0,
    "assigned_vehicle_ids" "text"[],
    CONSTRAINT "check_amount_positive" CHECK (("amount" >= (0)::numeric)),
    CONSTRAINT "check_escort_count_limit" CHECK ((("escort_count" >= 0) AND ("escort_count" <= 2))),
    CONSTRAINT "check_escort_status" CHECK (("escort_status" = ANY (ARRAY['not_assigned'::"text", 'partially_assigned'::"text", 'fully_assigned'::"text"]))),
    CONSTRAINT "trips_escort_count_check" CHECK ((("escort_count" >= 1) AND ("escort_count" <= 3))),
    CONSTRAINT "trips_escort_status_check" CHECK (("escort_status" = ANY (ARRAY['not_assigned'::"text", 'partially_assigned'::"text", 'fully_assigned'::"text"])))
);


ALTER TABLE "public"."trips" OWNER TO "postgres";


COMMENT ON TABLE "public"."trips" IS 'Trip bookings and assignments - cleaned of convoy functionality';



COMMENT ON COLUMN "public"."trips"."has_security_escort" IS 'Whether trip requires security escort vehicles';



COMMENT ON COLUMN "public"."trips"."escort_count" IS 'Number of escort vehicles required (maximum 2)';



COMMENT ON COLUMN "public"."trips"."escort_vehicle_ids" IS 'JSON array of vehicle IDs assigned as security escorts';



COMMENT ON COLUMN "public"."trips"."escort_status" IS 'Status of escort assignment: not_assigned, partially_assigned, fully_assigned';



COMMENT ON COLUMN "public"."trips"."escort_assigned_at" IS 'Timestamp when escorts were last assigned';



CREATE TABLE IF NOT EXISTS "public"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role_slug" "text" NOT NULL,
    "granted_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."vehicle_incident_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "incident_id" "uuid" NOT NULL,
    "image_url" "text" NOT NULL,
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."vehicle_incident_images" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicle_incident_images" IS 'Image references linked to vehicle incident reports';



COMMENT ON COLUMN "public"."vehicle_incident_images"."image_url" IS 'Public URL of the stored image in the images bucket';



CREATE TABLE IF NOT EXISTS "public"."vehicle_incident_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "driver_id" "uuid",
    "incident_date" "date" NOT NULL,
    "incident_time" time without time zone,
    "incident_type" "public"."incident_type" DEFAULT 'accident'::"public"."incident_type" NOT NULL,
    "severity" "public"."incident_severity" DEFAULT 'minor'::"public"."incident_severity" NOT NULL,
    "status" "public"."incident_status" DEFAULT 'reported'::"public"."incident_status" NOT NULL,
    "location" "text" NOT NULL,
    "description" "text" NOT NULL,
    "injuries_reported" boolean DEFAULT false NOT NULL,
    "third_party_involved" boolean DEFAULT false NOT NULL,
    "photos_attached" boolean DEFAULT false NOT NULL,
    "police_report_number" "text",
    "insurance_claim_number" "text",
    "estimated_damage_cost" numeric(10,2),
    "actual_repair_cost" numeric(10,2),
    "third_party_details" "text",
    "witness_details" "text",
    "reported_by" "text" NOT NULL,
    "follow_up_required" boolean DEFAULT false NOT NULL,
    "follow_up_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "damage_details" "text",
    CONSTRAINT "vehicle_incident_reports_actual_repair_cost_check" CHECK (("actual_repair_cost" >= (0)::numeric)),
    CONSTRAINT "vehicle_incident_reports_estimated_damage_cost_check" CHECK (("estimated_damage_cost" >= (0)::numeric))
);


ALTER TABLE "public"."vehicle_incident_reports" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicle_incident_reports" IS 'Stores detailed information about vehicle incidents, accidents, thefts, breakdowns, and insurance claims';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."id" IS 'Unique identifier for the incident report';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."vehicle_id" IS 'Reference to the vehicle involved in the incident';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."driver_id" IS 'Reference to the driver involved (optional)';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."incident_date" IS 'Date when the incident occurred';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."incident_time" IS 'Time when the incident occurred (optional)';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."incident_type" IS 'Type of incident (accident, theft, vandalism, etc.)';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."severity" IS 'Severity level of the incident';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."status" IS 'Current status of the incident investigation/resolution';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."location" IS 'Location where the incident occurred';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."description" IS 'Detailed description of what happened';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."injuries_reported" IS 'Whether any injuries were reported';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."third_party_involved" IS 'Whether other parties were involved';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."photos_attached" IS 'Whether photos are available for this incident';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."police_report_number" IS 'Official police report number (if applicable)';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."insurance_claim_number" IS 'Insurance claim number (if applicable)';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."estimated_damage_cost" IS 'Initial estimated cost of damages';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."actual_repair_cost" IS 'Final actual cost of repairs';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."third_party_details" IS 'Details about other parties involved';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."witness_details" IS 'Information about witnesses';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."reported_by" IS 'Name of person who reported the incident';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."follow_up_required" IS 'Whether follow-up action is required';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."follow_up_date" IS 'Date for scheduled follow-up';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."notes" IS 'Additional notes and observations';



COMMENT ON COLUMN "public"."vehicle_incident_reports"."damage_details" IS 'JSON data of damaged car parts with severity levels';



CREATE TABLE IF NOT EXISTS "public"."vehicle_inspections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "inspector_name" "text" NOT NULL,
    "inspection_date" "date" NOT NULL,
    "pre_trip" boolean DEFAULT false,
    "post_trip" boolean DEFAULT false,
    "overall_status" "public"."inspection_status" DEFAULT 'pass'::"public"."inspection_status",
    "mileage" integer DEFAULT 0,
    "fuel_level" integer DEFAULT 100,
    "engine_oil" "public"."fluid_level" DEFAULT 'good'::"public"."fluid_level",
    "coolant" "public"."fluid_level" DEFAULT 'good'::"public"."fluid_level",
    "brake_fluid" "public"."fluid_level" DEFAULT 'good'::"public"."fluid_level",
    "tires_condition" "public"."condition_status" DEFAULT 'good'::"public"."condition_status",
    "lights_working" boolean DEFAULT true,
    "brakes_working" boolean DEFAULT true,
    "steering_working" boolean DEFAULT true,
    "horn_working" boolean DEFAULT true,
    "wipers_working" boolean DEFAULT true,
    "mirrors_clean" boolean DEFAULT true,
    "seatbelts_working" boolean DEFAULT true,
    "first_aid_kit" boolean DEFAULT true,
    "fire_extinguisher" boolean DEFAULT true,
    "warning_triangle" boolean DEFAULT true,
    "jack_spare_tire" boolean DEFAULT true,
    "documents_present" boolean DEFAULT true,
    "interior_clean" boolean DEFAULT true,
    "exterior_clean" boolean DEFAULT true,
    "defects_noted" "text",
    "corrective_actions" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "vehicle_inspections_fuel_level_check" CHECK ((("fuel_level" >= 0) AND ("fuel_level" <= 100)))
);


ALTER TABLE "public"."vehicle_inspections" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicle_inspections" IS 'Daily vehicle inspection checklists and safety records';



COMMENT ON COLUMN "public"."vehicle_inspections"."vehicle_id" IS 'Reference to the inspected vehicle';



COMMENT ON COLUMN "public"."vehicle_inspections"."inspector_name" IS 'Name of the person conducting the inspection';



COMMENT ON COLUMN "public"."vehicle_inspections"."inspection_date" IS 'Date when the inspection was conducted';



COMMENT ON COLUMN "public"."vehicle_inspections"."pre_trip" IS 'Whether this is a pre-trip inspection';



COMMENT ON COLUMN "public"."vehicle_inspections"."post_trip" IS 'Whether this is a post-trip inspection';



COMMENT ON COLUMN "public"."vehicle_inspections"."overall_status" IS 'Overall inspection result: pass, fail, or conditional';



COMMENT ON COLUMN "public"."vehicle_inspections"."mileage" IS 'Vehicle mileage at time of inspection';



COMMENT ON COLUMN "public"."vehicle_inspections"."fuel_level" IS 'Fuel level percentage (0-100)';



COMMENT ON COLUMN "public"."vehicle_inspections"."defects_noted" IS 'Description of any defects or issues found';



COMMENT ON COLUMN "public"."vehicle_inspections"."corrective_actions" IS 'Required corrective actions to address issues';



COMMENT ON COLUMN "public"."vehicle_inspections"."notes" IS 'Additional observations or comments';



CREATE TABLE IF NOT EXISTS "public"."vehicle_leases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "vehicle_id" "uuid" NOT NULL,
    "lessee_name" character varying(255) NOT NULL,
    "lessee_email" character varying(255) NOT NULL,
    "lessee_phone" character varying(50) NOT NULL,
    "lessee_address" "text" NOT NULL,
    "lease_start_date" "date" NOT NULL,
    "lease_end_date" "date" NOT NULL,
    "monthly_rate" numeric(10,2) NOT NULL,
    "security_deposit" numeric(10,2) DEFAULT 0,
    "mileage_limit" integer NOT NULL,
    "excess_mileage_rate" numeric(5,2) DEFAULT 0,
    "lease_status" "public"."lease_status" DEFAULT 'pending'::"public"."lease_status",
    "payment_status" "public"."payment_status" DEFAULT 'current'::"public"."payment_status",
    "contract_number" character varying(50) NOT NULL,
    "notes" "text",
    "insurance_required" boolean DEFAULT true,
    "maintenance_included" boolean DEFAULT false,
    "driver_included" boolean DEFAULT false,
    "fuel_included" boolean DEFAULT false,
    "assigned_driver_id" "uuid",
    "early_termination_fee" numeric(10,2) DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "contract_id" "uuid",
    "daily_rate" numeric(10,2),
    CONSTRAINT "check_daily_rate_positive" CHECK (("daily_rate" > (0)::numeric)),
    CONSTRAINT "check_lease_dates" CHECK (("lease_end_date" > "lease_start_date")),
    CONSTRAINT "vehicle_leases_early_termination_fee_check" CHECK (("early_termination_fee" >= (0)::numeric)),
    CONSTRAINT "vehicle_leases_excess_mileage_rate_check" CHECK (("excess_mileage_rate" >= (0)::numeric)),
    CONSTRAINT "vehicle_leases_mileage_limit_check" CHECK (("mileage_limit" > 0)),
    CONSTRAINT "vehicle_leases_monthly_rate_check" CHECK (("monthly_rate" > (0)::numeric)),
    CONSTRAINT "vehicle_leases_security_deposit_check" CHECK (("security_deposit" >= (0)::numeric))
);


ALTER TABLE "public"."vehicle_leases" OWNER TO "postgres";


COMMENT ON TABLE "public"."vehicle_leases" IS 'Vehicle lease agreements and customer information';



COMMENT ON COLUMN "public"."vehicle_leases"."vehicle_id" IS 'Reference to the leased vehicle';



COMMENT ON COLUMN "public"."vehicle_leases"."monthly_rate" IS 'Monthly lease payment amount in USD';



COMMENT ON COLUMN "public"."vehicle_leases"."security_deposit" IS 'Security deposit amount in USD';



COMMENT ON COLUMN "public"."vehicle_leases"."mileage_limit" IS 'Annual mileage limit in miles';



COMMENT ON COLUMN "public"."vehicle_leases"."excess_mileage_rate" IS 'Charge per mile over the limit in USD';



COMMENT ON COLUMN "public"."vehicle_leases"."contract_number" IS 'Unique lease contract identifier (format: LSE-XXXXXX)';



COMMENT ON COLUMN "public"."vehicle_leases"."insurance_required" IS 'Whether lessee must maintain insurance';



COMMENT ON COLUMN "public"."vehicle_leases"."maintenance_included" IS 'Whether maintenance is included in lease';



COMMENT ON COLUMN "public"."vehicle_leases"."driver_included" IS 'Whether a driver is provided with the lease';



COMMENT ON COLUMN "public"."vehicle_leases"."fuel_included" IS 'Whether fuel costs are included in the lease';



COMMENT ON COLUMN "public"."vehicle_leases"."assigned_driver_id" IS 'Driver assigned to this lease (if driver_included is true)';



COMMENT ON COLUMN "public"."vehicle_leases"."early_termination_fee" IS 'Fee for early lease termination in USD';



CREATE TABLE IF NOT EXISTS "public"."vehicles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" "public"."vehicle_type" NOT NULL,
    "make" "text" NOT NULL,
    "model" "text" NOT NULL,
    "registration" "text" NOT NULL,
    "year" integer,
    "color" "text",
    "vin" "text",
    "insurance_expiry" "date",
    "status" "public"."vehicle_status" DEFAULT 'active'::"public"."vehicle_status",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "fuel_type" "public"."fuel_type",
    "is_escort_assigned" boolean DEFAULT false,
    "escort_trip_id" "uuid",
    "escort_assigned_at" timestamp with time zone,
    "original_status" "public"."vehicle_status"
);


ALTER TABLE "public"."vehicles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."vehicles"."is_escort_assigned" IS 'Whether vehicle is currently assigned as security escort';



COMMENT ON COLUMN "public"."vehicles"."escort_trip_id" IS 'ID of trip this vehicle is escorting (if assigned)';



COMMENT ON COLUMN "public"."vehicles"."escort_assigned_at" IS 'Timestamp when vehicle was assigned as escort';



CREATE OR REPLACE VIEW "public"."vw_user_pages" WITH ("security_barrier"='true') AS
 SELECT "ur"."user_id",
    COALESCE("array_agg"(DISTINCT
        CASE
            WHEN ("rpa"."page_id" = '*'::"text") THEN "p_all"."id"
            ELSE "rpa"."page_id"
        END) FILTER (WHERE ("rpa"."page_id" IS NOT NULL)), '{}'::"text"[]) AS "pages"
   FROM (("public"."user_roles" "ur"
     LEFT JOIN "public"."role_page_access" "rpa" ON (("rpa"."role_slug" = "ur"."role_slug")))
     LEFT JOIN "public"."pages" "p_all" ON (true))
  GROUP BY "ur"."user_id";


ALTER TABLE "public"."vw_user_pages" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."vw_user_roles" WITH ("security_barrier"='true') AS
 SELECT "u"."id" AS "user_id",
    "u"."email",
    ("u"."raw_user_meta_data" ->> 'full_name'::"text") AS "full_name",
    "u"."created_at",
    COALESCE("array_agg"("ur"."role_slug"), '{}'::"text"[]) AS "roles"
   FROM ("auth"."users" "u"
     LEFT JOIN "public"."user_roles" "ur" ON (("ur"."user_id" = "u"."id")))
  GROUP BY "u"."id";


ALTER TABLE "public"."vw_user_roles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."alerts"
    ADD CONSTRAINT "alerts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_bookings"
    ADD CONSTRAINT "client_bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clients"
    ADD CONSTRAINT "clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contracts"
    ADD CONSTRAINT "contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."drivers"
    ADD CONSTRAINT "drivers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fuel_management"
    ADD CONSTRAINT "fuel_tanks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invitation_letters"
    ADD CONSTRAINT "invitation_letters_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."maintenance"
    ADD CONSTRAINT "maintenance_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."pages"
    ADD CONSTRAINT "pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_page_access"
    ADD CONSTRAINT "role_page_access_pkey" PRIMARY KEY ("role_slug", "page_id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."roles"
    ADD CONSTRAINT "roles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."spare_parts"
    ADD CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fuel_fills"
    ADD CONSTRAINT "tank_fills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_assignments"
    ADD CONSTRAINT "trip_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_feedback"
    ADD CONSTRAINT "trip_feedback_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_messages"
    ADD CONSTRAINT "trip_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trip_tracking"
    ADD CONSTRAINT "trip_tracking_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "trips_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role_slug");



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_incident_images"
    ADD CONSTRAINT "vehicle_incident_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_incident_reports"
    ADD CONSTRAINT "vehicle_incident_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_inspections"
    ADD CONSTRAINT "vehicle_inspections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "vehicle_leases_contract_number_key" UNIQUE ("contract_number");



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "vehicle_leases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_registration_key" UNIQUE ("registration");



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_vin_key" UNIQUE ("vin");



CREATE UNIQUE INDEX "contracts_contract_number_unique_idx" ON "public"."contracts" USING "btree" ("contract_number");



CREATE UNIQUE INDEX "fuel_management_id_fuel_type_uidx" ON "public"."fuel_management" USING "btree" ("id", "fuel_type");



CREATE INDEX "idx_drivers_is_vip" ON "public"."drivers" USING "btree" ("is_vip");



CREATE INDEX "idx_trips_armoured_needed" ON "public"."trips" USING "btree" ("armoured_count");



CREATE INDEX "idx_trips_assigned_vehicles" ON "public"."trips" USING "gin" ("assigned_vehicle_ids");



CREATE INDEX "idx_trips_client_id" ON "public"."trips" USING "btree" ("client_id");



CREATE INDEX "idx_trips_date" ON "public"."trips" USING "btree" ("date");



CREATE INDEX "idx_trips_date_status" ON "public"."trips" USING "btree" ("date", "status");



CREATE INDEX "idx_trips_driver_id" ON "public"."trips" USING "btree" ("driver_id");



CREATE INDEX "idx_trips_escort_status" ON "public"."trips" USING "btree" ("escort_status");



CREATE INDEX "idx_trips_escort_vehicle_ids" ON "public"."trips" USING "gin" ("escort_vehicle_ids");



CREATE INDEX "idx_trips_security_escort" ON "public"."trips" USING "btree" ("has_security_escort");



CREATE INDEX "idx_trips_service_type" ON "public"."trips" USING "btree" ("service_type");



CREATE INDEX "idx_trips_soft_skin_needed" ON "public"."trips" USING "btree" ("soft_skin_count");



CREATE INDEX "idx_trips_status" ON "public"."trips" USING "btree" ("status");



CREATE INDEX "idx_trips_vehicle_id" ON "public"."trips" USING "btree" ("vehicle_id");



CREATE INDEX "idx_trips_vehicle_type" ON "public"."trips" USING "btree" ("vehicle_type");



CREATE INDEX "idx_vehicle_incident_images_incident_id" ON "public"."vehicle_incident_images" USING "btree" ("incident_id");



CREATE INDEX "idx_vehicle_incident_reports_created_at" ON "public"."vehicle_incident_reports" USING "btree" ("created_at");



CREATE INDEX "idx_vehicle_incident_reports_driver_id" ON "public"."vehicle_incident_reports" USING "btree" ("driver_id");



CREATE INDEX "idx_vehicle_incident_reports_incident_date" ON "public"."vehicle_incident_reports" USING "btree" ("incident_date");



CREATE INDEX "idx_vehicle_incident_reports_incident_type" ON "public"."vehicle_incident_reports" USING "btree" ("incident_type");



CREATE INDEX "idx_vehicle_incident_reports_severity" ON "public"."vehicle_incident_reports" USING "btree" ("severity");



CREATE INDEX "idx_vehicle_incident_reports_status" ON "public"."vehicle_incident_reports" USING "btree" ("status");



CREATE INDEX "idx_vehicle_incident_reports_vehicle_id" ON "public"."vehicle_incident_reports" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicle_inspections_date" ON "public"."vehicle_inspections" USING "btree" ("inspection_date");



CREATE INDEX "idx_vehicle_inspections_inspector" ON "public"."vehicle_inspections" USING "btree" ("inspector_name");



CREATE INDEX "idx_vehicle_inspections_status" ON "public"."vehicle_inspections" USING "btree" ("overall_status");



CREATE INDEX "idx_vehicle_inspections_vehicle_id" ON "public"."vehicle_inspections" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicle_leases_assigned_driver" ON "public"."vehicle_leases" USING "btree" ("assigned_driver_id");



CREATE INDEX "idx_vehicle_leases_contract_id" ON "public"."vehicle_leases" USING "btree" ("contract_id");



CREATE INDEX "idx_vehicle_leases_lease_dates" ON "public"."vehicle_leases" USING "btree" ("lease_start_date", "lease_end_date");



CREATE INDEX "idx_vehicle_leases_lease_status" ON "public"."vehicle_leases" USING "btree" ("lease_status");



CREATE INDEX "idx_vehicle_leases_lessee_email" ON "public"."vehicle_leases" USING "btree" ("lessee_email");



CREATE INDEX "idx_vehicle_leases_payment_status" ON "public"."vehicle_leases" USING "btree" ("payment_status");



CREATE INDEX "idx_vehicle_leases_vehicle_id" ON "public"."vehicle_leases" USING "btree" ("vehicle_id");



CREATE INDEX "idx_vehicles_escort_assigned" ON "public"."vehicles" USING "btree" ("is_escort_assigned");



CREATE INDEX "idx_vehicles_escort_trip_id" ON "public"."vehicles" USING "btree" ("escort_trip_id");



CREATE INDEX "invitation_letters_created_at_idx" ON "public"."invitation_letters" USING "btree" ("created_at" DESC);



CREATE INDEX "invitation_letters_generated_by_idx" ON "public"."invitation_letters" USING "btree" ("generated_by");



CREATE INDEX "invitation_letters_ref_number_idx" ON "public"."invitation_letters" USING "btree" ("ref_number");



CREATE INDEX "invitation_letters_visitor_name_idx" ON "public"."invitation_letters" USING "btree" ("visitor_name");



CREATE OR REPLACE TRIGGER "trg_fuel_logs_default_first_entry" BEFORE INSERT ON "public"."fuel_logs" FOR EACH ROW EXECUTE FUNCTION "public"."fuel_logs_default_first_entry"();



CREATE OR REPLACE TRIGGER "trg_sync_primary_vehicle" BEFORE INSERT OR UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."sync_primary_vehicle"();



CREATE OR REPLACE TRIGGER "trg_trips_prevent_vehicle_overlap" BEFORE INSERT OR UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."trips_prevent_vehicle_overlap"();



CREATE OR REPLACE TRIGGER "trigger_sync_vehicle_escort_on_delete" BEFORE DELETE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."sync_vehicle_escort_status"();



CREATE OR REPLACE TRIGGER "trigger_sync_vehicle_escort_on_update" AFTER UPDATE OF "escort_vehicle_ids" ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."sync_vehicle_escort_status"();



CREATE OR REPLACE TRIGGER "trigger_update_vehicle_incident_reports_updated_at" BEFORE UPDATE ON "public"."vehicle_incident_reports" FOR EACH ROW EXECUTE FUNCTION "public"."update_vehicle_incident_reports_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_vehicle_inspections_updated_at" BEFORE UPDATE ON "public"."vehicle_inspections" FOR EACH ROW EXECUTE FUNCTION "public"."update_vehicle_inspections_updated_at"();



CREATE OR REPLACE TRIGGER "update_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_alerts_updated_at" BEFORE UPDATE ON "public"."alerts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_bookings_updated_at" BEFORE UPDATE ON "public"."client_bookings" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_contacts_updated_at" BEFORE UPDATE ON "public"."client_contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_members_updated_at" BEFORE UPDATE ON "public"."client_members" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_client_users_updated_at" BEFORE UPDATE ON "public"."client_users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clients_updated_at" BEFORE UPDATE ON "public"."clients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contracts_updated_at" BEFORE UPDATE ON "public"."contracts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_drivers_updated_at" BEFORE UPDATE ON "public"."drivers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_fuel_logs_updated_at" BEFORE UPDATE ON "public"."fuel_logs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invitation_letters_updated_at" BEFORE UPDATE ON "public"."invitation_letters" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_invoices_updated_at" BEFORE UPDATE ON "public"."invoices" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_maintenance_updated_at" BEFORE UPDATE ON "public"."maintenance" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_quotations_updated_at" BEFORE UPDATE ON "public"."quotations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_spare_parts_updated_at" BEFORE UPDATE ON "public"."spare_parts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trip_assignments_updated_at" BEFORE UPDATE ON "public"."trip_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trip_feedback_updated_at" BEFORE UPDATE ON "public"."trip_feedback" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trip_messages_updated_at" BEFORE UPDATE ON "public"."trip_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trip_tracking_updated_at" BEFORE UPDATE ON "public"."trip_tracking" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_trips_updated_at" BEFORE UPDATE ON "public"."trips" FOR EACH ROW EXECUTE FUNCTION "public"."update_trips_updated_at"();



CREATE OR REPLACE TRIGGER "update_vehicle_images_updated_at" BEFORE UPDATE ON "public"."vehicle_images" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_vehicle_leases_updated_at" BEFORE UPDATE ON "public"."vehicle_leases" FOR EACH ROW EXECUTE FUNCTION "public"."update_vehicle_leases_updated_at"();



CREATE OR REPLACE TRIGGER "update_vehicles_updated_at" BEFORE UPDATE ON "public"."vehicles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."client_bookings"
    ADD CONSTRAINT "client_bookings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_bookings"
    ADD CONSTRAINT "client_bookings_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_contacts"
    ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_members"
    ADD CONSTRAINT "client_members_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."client_users"
    ADD CONSTRAINT "client_users_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "fk_trips_client_id" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "fk_trips_driver_id" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."trips"
    ADD CONSTRAINT "fk_trips_vehicle_id" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "fk_vehicle_leases_contract_id" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_storage_fuel_type_fk" FOREIGN KEY ("fuel_management_id", "fuel_type") REFERENCES "public"."fuel_management"("id", "fuel_type") ON UPDATE CASCADE ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_tank_id_fkey" FOREIGN KEY ("fuel_management_id") REFERENCES "public"."fuel_management"("id");



ALTER TABLE ONLY "public"."fuel_logs"
    ADD CONSTRAINT "fuel_logs_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id");



ALTER TABLE ONLY "public"."invitation_letters"
    ADD CONSTRAINT "invitation_letters_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."invoices"
    ADD CONSTRAINT "invoices_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "public"."quotations"("id");



ALTER TABLE ONLY "public"."maintenance"
    ADD CONSTRAINT "maintenance_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."quotations"
    ADD CONSTRAINT "quotations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_page_access"
    ADD CONSTRAINT "role_page_access_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "public"."pages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_page_access"
    ADD CONSTRAINT "role_page_access_role_slug_fkey" FOREIGN KEY ("role_slug") REFERENCES "public"."roles"("slug") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."spare_parts"
    ADD CONSTRAINT "spare_parts_maintenance_id_fkey" FOREIGN KEY ("maintenance_id") REFERENCES "public"."maintenance"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."fuel_fills"
    ADD CONSTRAINT "tank_fills_tank_id_fkey" FOREIGN KEY ("fuel_management_id") REFERENCES "public"."fuel_management"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_assignments"
    ADD CONSTRAINT "trip_assignments_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."trip_feedback"
    ADD CONSTRAINT "trip_feedback_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "public"."client_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_role_slug_fkey" FOREIGN KEY ("role_slug") REFERENCES "public"."roles"("slug") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_roles"
    ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_images"
    ADD CONSTRAINT "vehicle_images_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_incident_images"
    ADD CONSTRAINT "vehicle_incident_images_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "public"."vehicle_incident_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_incident_reports"
    ADD CONSTRAINT "vehicle_incident_reports_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_incident_reports"
    ADD CONSTRAINT "vehicle_incident_reports_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_inspections"
    ADD CONSTRAINT "vehicle_inspections_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "vehicle_leases_assigned_driver_id_fkey" FOREIGN KEY ("assigned_driver_id") REFERENCES "public"."drivers"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."vehicle_leases"
    ADD CONSTRAINT "vehicle_leases_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vehicles"
    ADD CONSTRAINT "vehicles_escort_trip_id_fkey" FOREIGN KEY ("escort_trip_id") REFERENCES "public"."trips"("id") ON DELETE SET NULL;



CREATE POLICY "Allow all operations for authenticated users" ON "public"."vehicle_inspections" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow all operations on trip_assignments" ON "public"."trip_assignments" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all operations on trip_messages" ON "public"."trip_messages" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to delete drivers" ON "public"."drivers" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to delete maintenance records" ON "public"."maintenance" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to insert drivers" ON "public"."drivers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to insert maintenance records" ON "public"."maintenance" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to read drivers" ON "public"."drivers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read maintenance records" ON "public"."maintenance" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to update drivers" ON "public"."drivers" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update maintenance records" ON "public"."maintenance" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow delete on incident images" ON "public"."vehicle_incident_images" FOR DELETE USING (true);



CREATE POLICY "Allow insert on incident images" ON "public"."vehicle_incident_images" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow select on incident images" ON "public"."vehicle_incident_images" FOR SELECT USING (true);



CREATE POLICY "Enable all operations for authenticated users" ON "public"."drivers" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable delete access for all authenticated users" ON "public"."drivers" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete access for authenticated users" ON "public"."fuel_logs" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "Enable delete for authenticated users only" ON "public"."invoices" FOR DELETE TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable insert access for all authenticated users" ON "public"."drivers" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert access for authenticated users" ON "public"."fuel_logs" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for authenticated users only" ON "public"."invoices" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Enable read access for all authenticated users" ON "public"."drivers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."fuel_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable select for all users" ON "public"."invoices" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable update access for all authenticated users" ON "public"."drivers" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update access for authenticated users" ON "public"."fuel_logs" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Enable update for authenticated users only" ON "public"."invoices" FOR UPDATE TO "authenticated", "anon" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create incident reports" ON "public"."vehicle_incident_reports" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create invitation letters" ON "public"."invitation_letters" FOR INSERT TO "authenticated" WITH CHECK (("generated_by" = "auth"."uid"()));



CREATE POLICY "Users can delete incident reports" ON "public"."vehicle_incident_reports" FOR DELETE USING (true);



CREATE POLICY "Users can delete their own invitation letters" ON "public"."invitation_letters" FOR DELETE TO "authenticated" USING (("generated_by" = "auth"."uid"()));



CREATE POLICY "Users can delete trips" ON "public"."trips" FOR DELETE USING (true);



CREATE POLICY "Users can insert trips" ON "public"."trips" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can update incident reports" ON "public"."vehicle_incident_reports" FOR UPDATE USING (true);



CREATE POLICY "Users can update their own invitation letters" ON "public"."invitation_letters" FOR UPDATE TO "authenticated" USING (("generated_by" = "auth"."uid"())) WITH CHECK (("generated_by" = "auth"."uid"()));



CREATE POLICY "Users can update trips" ON "public"."trips" FOR UPDATE USING (true);



CREATE POLICY "Users can view all trips" ON "public"."trips" FOR SELECT USING (true);



CREATE POLICY "Users can view incident reports" ON "public"."vehicle_incident_reports" FOR SELECT USING (true);



CREATE POLICY "Users can view their own invitation letters" ON "public"."invitation_letters" FOR SELECT TO "authenticated" USING (("generated_by" = "auth"."uid"()));



ALTER TABLE "public"."client_bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_bookings_access" ON "public"."client_bookings" USING ((EXISTS ( SELECT 1
   FROM "public"."client_users"
  WHERE (("client_users"."id" = "client_bookings"."client_user_id") AND ("client_users"."client_id" = "client_bookings"."client_id")))));



ALTER TABLE "public"."client_users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "client_users_own_data" ON "public"."client_users" USING ((("auth"."uid"())::"text" = ("id")::"text"));



ALTER TABLE "public"."trip_feedback" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trip_feedback_access" ON "public"."trip_feedback" USING ((EXISTS ( SELECT 1
   FROM "public"."client_users"
  WHERE ("client_users"."id" = "trip_feedback"."client_user_id"))));



ALTER TABLE "public"."trip_tracking" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "trips_update_assignments" ON "public"."trips" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."vehicle_incident_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_incident_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_inspections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vehicle_leases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "vehicle_leases_delete_authenticated" ON "public"."vehicle_leases" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "vehicle_leases_insert_authenticated" ON "public"."vehicle_leases" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "vehicle_leases_select_authenticated" ON "public"."vehicle_leases" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "vehicle_leases_update_authenticated" ON "public"."vehicle_leases" FOR UPDATE TO "authenticated" USING (true);



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_table_to_publication"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."add_table_to_publication"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_table_to_publication"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_replica_identity"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_replica_identity"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_replica_identity"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_client_members_table"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_client_members_table"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_client_members_table"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enable_realtime_for_table"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."enable_realtime_for_table"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."enable_realtime_for_table"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."fuel_logs_default_first_entry"() TO "anon";
GRANT ALL ON FUNCTION "public"."fuel_logs_default_first_entry"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."fuel_logs_default_first_entry"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_storage_dispensed"("p_storage_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_storage_dispensed"("p_storage_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_storage_dispensed"("p_storage_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."modify_invoices_client_id_nullable"() TO "anon";
GRANT ALL ON FUNCTION "public"."modify_invoices_client_id_nullable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."modify_invoices_client_id_nullable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."modify_trips_client_id_nullable"() TO "anon";
GRANT ALL ON FUNCTION "public"."modify_trips_client_id_nullable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."modify_trips_client_id_nullable"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_replica_identity_full"("table_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."set_replica_identity_full"("table_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_replica_identity_full"("table_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_primary_vehicle"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_primary_vehicle"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_primary_vehicle"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_vehicle_escort_status"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_vehicle_escort_status"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_vehicle_escort_status"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trips_prevent_vehicle_overlap"() TO "anon";
GRANT ALL ON FUNCTION "public"."trips_prevent_vehicle_overlap"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trips_prevent_vehicle_overlap"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_part_notes"("part_id" "uuid", "notes_value" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_part_notes"("part_id" "uuid", "notes_value" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_part_notes"("part_id" "uuid", "notes_value" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_trips_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_trips_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_trips_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vehicle_incident_reports_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vehicle_incident_reports_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vehicle_incident_reports_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vehicle_inspections_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vehicle_inspections_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vehicle_inspections_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_vehicle_leases_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_vehicle_leases_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_vehicle_leases_updated_at"() TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."alerts" TO "anon";
GRANT ALL ON TABLE "public"."alerts" TO "authenticated";
GRANT ALL ON TABLE "public"."alerts" TO "service_role";



GRANT ALL ON TABLE "public"."client_bookings" TO "anon";
GRANT ALL ON TABLE "public"."client_bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."client_bookings" TO "service_role";



GRANT ALL ON TABLE "public"."client_contacts" TO "anon";
GRANT ALL ON TABLE "public"."client_contacts" TO "authenticated";
GRANT ALL ON TABLE "public"."client_contacts" TO "service_role";



GRANT ALL ON TABLE "public"."client_members" TO "anon";
GRANT ALL ON TABLE "public"."client_members" TO "authenticated";
GRANT ALL ON TABLE "public"."client_members" TO "service_role";



GRANT ALL ON TABLE "public"."client_users" TO "anon";
GRANT ALL ON TABLE "public"."client_users" TO "authenticated";
GRANT ALL ON TABLE "public"."client_users" TO "service_role";



GRANT ALL ON TABLE "public"."clients" TO "anon";
GRANT ALL ON TABLE "public"."clients" TO "authenticated";
GRANT ALL ON TABLE "public"."clients" TO "service_role";



GRANT ALL ON TABLE "public"."contracts" TO "anon";
GRANT ALL ON TABLE "public"."contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."contracts" TO "service_role";



GRANT ALL ON TABLE "public"."drivers" TO "anon";
GRANT ALL ON TABLE "public"."drivers" TO "authenticated";
GRANT ALL ON TABLE "public"."drivers" TO "service_role";



GRANT ALL ON TABLE "public"."fuel_fills" TO "anon";
GRANT ALL ON TABLE "public"."fuel_fills" TO "authenticated";
GRANT ALL ON TABLE "public"."fuel_fills" TO "service_role";



GRANT ALL ON TABLE "public"."fuel_logs" TO "anon";
GRANT ALL ON TABLE "public"."fuel_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."fuel_logs" TO "service_role";



GRANT ALL ON TABLE "public"."fuel_management" TO "anon";
GRANT ALL ON TABLE "public"."fuel_management" TO "authenticated";
GRANT ALL ON TABLE "public"."fuel_management" TO "service_role";



GRANT ALL ON TABLE "public"."invitation_letters" TO "anon";
GRANT ALL ON TABLE "public"."invitation_letters" TO "authenticated";
GRANT ALL ON TABLE "public"."invitation_letters" TO "service_role";



GRANT ALL ON TABLE "public"."invoices" TO "anon";
GRANT ALL ON TABLE "public"."invoices" TO "authenticated";
GRANT ALL ON TABLE "public"."invoices" TO "service_role";



GRANT ALL ON TABLE "public"."maintenance" TO "anon";
GRANT ALL ON TABLE "public"."maintenance" TO "authenticated";
GRANT ALL ON TABLE "public"."maintenance" TO "service_role";



GRANT ALL ON TABLE "public"."pages" TO "anon";
GRANT ALL ON TABLE "public"."pages" TO "authenticated";
GRANT ALL ON TABLE "public"."pages" TO "service_role";



GRANT ALL ON TABLE "public"."quotations" TO "anon";
GRANT ALL ON TABLE "public"."quotations" TO "authenticated";
GRANT ALL ON TABLE "public"."quotations" TO "service_role";



GRANT ALL ON TABLE "public"."role_page_access" TO "anon";
GRANT ALL ON TABLE "public"."role_page_access" TO "authenticated";
GRANT ALL ON TABLE "public"."role_page_access" TO "service_role";



GRANT ALL ON TABLE "public"."roles" TO "anon";
GRANT ALL ON TABLE "public"."roles" TO "authenticated";
GRANT ALL ON TABLE "public"."roles" TO "service_role";



GRANT ALL ON TABLE "public"."spare_parts" TO "anon";
GRANT ALL ON TABLE "public"."spare_parts" TO "authenticated";
GRANT ALL ON TABLE "public"."spare_parts" TO "service_role";



GRANT ALL ON TABLE "public"."trip_assignments" TO "anon";
GRANT ALL ON TABLE "public"."trip_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."trip_feedback" TO "anon";
GRANT ALL ON TABLE "public"."trip_feedback" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_feedback" TO "service_role";



GRANT ALL ON TABLE "public"."trip_messages" TO "anon";
GRANT ALL ON TABLE "public"."trip_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_messages" TO "service_role";



GRANT ALL ON TABLE "public"."trip_tracking" TO "anon";
GRANT ALL ON TABLE "public"."trip_tracking" TO "authenticated";
GRANT ALL ON TABLE "public"."trip_tracking" TO "service_role";



GRANT ALL ON TABLE "public"."trips" TO "anon";
GRANT ALL ON TABLE "public"."trips" TO "authenticated";
GRANT ALL ON TABLE "public"."trips" TO "service_role";



GRANT ALL ON TABLE "public"."user_roles" TO "anon";
GRANT ALL ON TABLE "public"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_roles" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_images" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_images" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_images" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_incident_images" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_incident_images" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_incident_images" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_incident_reports" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_incident_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_incident_reports" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_inspections" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_inspections" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_inspections" TO "service_role";



GRANT ALL ON TABLE "public"."vehicle_leases" TO "anon";
GRANT ALL ON TABLE "public"."vehicle_leases" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicle_leases" TO "service_role";



GRANT ALL ON TABLE "public"."vehicles" TO "anon";
GRANT ALL ON TABLE "public"."vehicles" TO "authenticated";
GRANT ALL ON TABLE "public"."vehicles" TO "service_role";



GRANT ALL ON TABLE "public"."vw_user_pages" TO "anon";
GRANT ALL ON TABLE "public"."vw_user_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_user_pages" TO "service_role";



GRANT ALL ON TABLE "public"."vw_user_roles" TO "anon";
GRANT ALL ON TABLE "public"."vw_user_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."vw_user_roles" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;

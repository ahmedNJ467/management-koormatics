-- Complete security hardening: Fix remaining functions with search path issues

-- Fix remaining functions that were missing from the previous migration
CREATE OR REPLACE FUNCTION public.set_replica_identity_full(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  EXECUTE format('ALTER TABLE %I REPLICA IDENTITY FULL', table_name);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_part_notes(part_id uuid, notes_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.add_table_to_publication(table_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.check_replica_identity(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  has_replica_identity_full boolean;
BEGIN
  SELECT relreplident = 'f' INTO has_replica_identity_full
  FROM pg_class
  WHERE oid = (quote_ident(table_name)::regclass);
  
  RETURN has_replica_identity_full;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enable_realtime_for_table(table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.create_client_members_table()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.modify_trips_client_id_nullable()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.modify_invoices_client_id_nullable()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
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
$function$;
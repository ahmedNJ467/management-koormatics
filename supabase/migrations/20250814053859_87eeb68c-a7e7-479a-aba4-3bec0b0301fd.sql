-- Fix critical RLS security issues and correct views

-- Secure trips table - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view all trips" ON public.trips;
CREATE POLICY "Allow authenticated users to view trips" 
ON public.trips 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Users can insert trips" ON public.trips;
CREATE POLICY "Allow authenticated users to insert trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Users can update trips" ON public.trips;
CREATE POLICY "Allow authenticated users to update trips" 
ON public.trips 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Users can delete trips" ON public.trips;
CREATE POLICY "Allow authenticated users to delete trips" 
ON public.trips 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Secure invoices table - restrict to authenticated users only  
DROP POLICY IF EXISTS "Enable select for all users" ON public.invoices;
CREATE POLICY "Allow authenticated users to view invoices" 
ON public.invoices 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.invoices;
CREATE POLICY "Allow authenticated users to insert invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.invoices;
CREATE POLICY "Allow authenticated users to update invoices" 
ON public.invoices 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.invoices;
CREATE POLICY "Allow authenticated users to delete invoices" 
ON public.invoices 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Secure vehicle_incident_reports table - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view incident reports" ON public.vehicle_incident_reports;
CREATE POLICY "Allow authenticated users to view incident reports" 
ON public.vehicle_incident_reports 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Users can create incident reports" ON public.vehicle_incident_reports;
CREATE POLICY "Allow authenticated users to insert incident reports" 
ON public.vehicle_incident_reports 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Users can update incident reports" ON public.vehicle_incident_reports;
CREATE POLICY "Allow authenticated users to update incident reports" 
ON public.vehicle_incident_reports 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Users can delete incident reports" ON public.vehicle_incident_reports;
CREATE POLICY "Allow authenticated users to delete incident reports" 
ON public.vehicle_incident_reports 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Secure vehicle_incident_images table - restrict to authenticated users only
DROP POLICY IF EXISTS "Allow select on incident images" ON public.vehicle_incident_images;
CREATE POLICY "Allow authenticated users to view incident images" 
ON public.vehicle_incident_images 
FOR SELECT 
USING (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Allow insert on incident images" ON public.vehicle_incident_images;
CREATE POLICY "Allow authenticated users to insert incident images" 
ON public.vehicle_incident_images 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

DROP POLICY IF EXISTS "Allow delete on incident images" ON public.vehicle_incident_images;
CREATE POLICY "Allow authenticated users to delete incident images" 
ON public.vehicle_incident_images 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Add missing update policy for vehicle_incident_images
CREATE POLICY "Allow authenticated users to update incident images" 
ON public.vehicle_incident_images 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

-- Fix the security definer views by dropping and recreating them without SECURITY DEFINER
-- First, check if profiles table exists and what columns it has
DO $$
BEGIN
    -- Drop existing views first
    DROP VIEW IF EXISTS public.vw_user_roles;
    DROP VIEW IF EXISTS public.vw_user_pages;
    
    -- Check if profiles table exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- If profiles table exists, check if it has user_id or id column
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id') THEN
            -- Create view with user_id column
            EXECUTE '
            CREATE VIEW public.vw_user_roles AS 
            SELECT 
              p.user_id,
              p.created_at,
              p.email,
              p.full_name,
              COALESCE(
                array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL),
                ''{}'':text[]
              ) AS roles
            FROM public.profiles p
            LEFT JOIN public.user_roles ur ON p.user_id = ur.user_id
            GROUP BY p.user_id, p.created_at, p.email, p.full_name';
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'id') THEN
            -- Create view with id column
            EXECUTE '
            CREATE VIEW public.vw_user_roles AS 
            SELECT 
              p.id as user_id,
              p.created_at,
              p.email,
              p.full_name,
              COALESCE(
                array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL),
                ''{}'':text[]
              ) AS roles
            FROM public.profiles p
            LEFT JOIN public.user_roles ur ON p.id = ur.user_id
            GROUP BY p.id, p.created_at, p.email, p.full_name';
        END IF;
    ELSE
        -- Create simple view without profiles table
        EXECUTE '
        CREATE VIEW public.vw_user_roles AS 
        SELECT 
          ur.user_id,
          NOW() as created_at,
          '''' as email,
          '''' as full_name,
          COALESCE(
            array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL),
            ''{}'':text[]
          ) AS roles
        FROM public.user_roles ur
        GROUP BY ur.user_id';
    END IF;
    
    -- Create the user pages view
    EXECUTE '
    CREATE VIEW public.vw_user_pages AS
    SELECT 
      ur.user_id,
      COALESCE(
        array_agg(DISTINCT rpa.page_id) FILTER (WHERE rpa.page_id IS NOT NULL),
        ''{}'':text[]
      ) AS pages
    FROM public.user_roles ur
    LEFT JOIN public.role_page_access rpa ON ur.role_slug = rpa.role_slug
    GROUP BY ur.user_id';
END
$$;
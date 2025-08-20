-- Fix critical RLS security issues

-- Secure trips table - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view all trips" ON public.trips;
DROP POLICY IF EXISTS "Users can insert trips" ON public.trips;
DROP POLICY IF EXISTS "Users can update trips" ON public.trips;
DROP POLICY IF EXISTS "Users can delete trips" ON public.trips;
DROP POLICY IF EXISTS "trips_update_assignments" ON public.trips;

CREATE POLICY "Allow authenticated users to view trips" ON public.trips FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to insert trips" ON public.trips FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to update trips" ON public.trips FOR UPDATE USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to delete trips" ON public.trips FOR DELETE USING (auth.role() = 'authenticated'::text);

-- Secure invoices table - restrict to authenticated users only  
DROP POLICY IF EXISTS "Enable select for all users" ON public.invoices;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.invoices;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.invoices;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.invoices;

CREATE POLICY "Allow authenticated users to view invoices" ON public.invoices FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to insert invoices" ON public.invoices FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to update invoices" ON public.invoices FOR UPDATE USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to delete invoices" ON public.invoices FOR DELETE USING (auth.role() = 'authenticated'::text);

-- Secure vehicle_incident_reports table - restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view incident reports" ON public.vehicle_incident_reports;
DROP POLICY IF EXISTS "Users can create incident reports" ON public.vehicle_incident_reports;
DROP POLICY IF EXISTS "Users can update incident reports" ON public.vehicle_incident_reports;
DROP POLICY IF EXISTS "Users can delete incident reports" ON public.vehicle_incident_reports;

CREATE POLICY "Allow authenticated users to view incident reports" ON public.vehicle_incident_reports FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to insert incident reports" ON public.vehicle_incident_reports FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to update incident reports" ON public.vehicle_incident_reports FOR UPDATE USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to delete incident reports" ON public.vehicle_incident_reports FOR DELETE USING (auth.role() = 'authenticated'::text);

-- Secure vehicle_incident_images table - restrict to authenticated users only
DROP POLICY IF EXISTS "Allow select on incident images" ON public.vehicle_incident_images;
DROP POLICY IF EXISTS "Allow insert on incident images" ON public.vehicle_incident_images;
DROP POLICY IF EXISTS "Allow delete on incident images" ON public.vehicle_incident_images;

CREATE POLICY "Allow authenticated users to view incident images" ON public.vehicle_incident_images FOR SELECT USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to insert incident images" ON public.vehicle_incident_images FOR INSERT WITH CHECK (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to update incident images" ON public.vehicle_incident_images FOR UPDATE USING (auth.role() = 'authenticated'::text);
CREATE POLICY "Allow authenticated users to delete incident images" ON public.vehicle_incident_images FOR DELETE USING (auth.role() = 'authenticated'::text);
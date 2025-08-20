-- Critical Security Fix: Add comprehensive RLS policies for all missing tables

-- 1. Enable RLS and add policies for vehicles table
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view vehicles" 
ON public.vehicles FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert vehicles" 
ON public.vehicles FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update vehicles" 
ON public.vehicles FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete vehicles" 
ON public.vehicles FOR DELETE 
USING (auth.role() = 'authenticated');

-- 2. Enable RLS and add policies for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view clients" 
ON public.clients FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert clients" 
ON public.clients FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update clients" 
ON public.clients FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete clients" 
ON public.clients FOR DELETE 
USING (auth.role() = 'authenticated');

-- 3. Enable RLS and add policies for client_contacts table
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view client contacts" 
ON public.client_contacts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert client contacts" 
ON public.client_contacts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update client contacts" 
ON public.client_contacts FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete client contacts" 
ON public.client_contacts FOR DELETE 
USING (auth.role() = 'authenticated');

-- 4. Enable RLS and add policies for client_members table
ALTER TABLE public.client_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view client members" 
ON public.client_members FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert client members" 
ON public.client_members FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update client members" 
ON public.client_members FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete client members" 
ON public.client_members FOR DELETE 
USING (auth.role() = 'authenticated');

-- 5. Enable RLS and add policies for activities table
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view activities" 
ON public.activities FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert activities" 
ON public.activities FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update activities" 
ON public.activities FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete activities" 
ON public.activities FOR DELETE 
USING (auth.role() = 'authenticated');

-- 6. Enable RLS and add policies for alerts table
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view alerts" 
ON public.alerts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert alerts" 
ON public.alerts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update alerts" 
ON public.alerts FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete alerts" 
ON public.alerts FOR DELETE 
USING (auth.role() = 'authenticated');

-- 7. Enable RLS and add policies for contracts table
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view contracts" 
ON public.contracts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert contracts" 
ON public.contracts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update contracts" 
ON public.contracts FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete contracts" 
ON public.contracts FOR DELETE 
USING (auth.role() = 'authenticated');

-- 8. Enable RLS and add policies for fuel_management table
ALTER TABLE public.fuel_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view fuel management" 
ON public.fuel_management FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert fuel management" 
ON public.fuel_management FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update fuel management" 
ON public.fuel_management FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete fuel management" 
ON public.fuel_management FOR DELETE 
USING (auth.role() = 'authenticated');

-- 9. Enable RLS and add policies for fuel_fills table
ALTER TABLE public.fuel_fills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view fuel fills" 
ON public.fuel_fills FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert fuel fills" 
ON public.fuel_fills FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update fuel fills" 
ON public.fuel_fills FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete fuel fills" 
ON public.fuel_fills FOR DELETE 
USING (auth.role() = 'authenticated');

-- 10. Enable RLS and add policies for quotations table
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view quotations" 
ON public.quotations FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert quotations" 
ON public.quotations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update quotations" 
ON public.quotations FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete quotations" 
ON public.quotations FOR DELETE 
USING (auth.role() = 'authenticated');

-- 11. Enable RLS and add policies for roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view roles" 
ON public.roles FOR SELECT 
USING (auth.role() = 'authenticated');

-- 12. Enable RLS and add policies for role_page_access table
ALTER TABLE public.role_page_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view role page access" 
ON public.role_page_access FOR SELECT 
USING (auth.role() = 'authenticated');

-- 13. Enable RLS and add policies for user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view user roles" 
ON public.user_roles FOR SELECT 
USING (auth.role() = 'authenticated');

-- Only super_admin can modify user roles
CREATE POLICY "Only super_admin can insert user roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role_slug = 'super_admin'
  )
);

CREATE POLICY "Only super_admin can update user roles" 
ON public.user_roles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role_slug = 'super_admin'
  )
);

CREATE POLICY "Only super_admin can delete user roles" 
ON public.user_roles FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role_slug = 'super_admin'
  )
);

-- 14. Enable RLS and add policies for pages table
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view pages" 
ON public.pages FOR SELECT 
USING (auth.role() = 'authenticated');

-- 15. Enable RLS and add policies for spare_parts table
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view spare parts" 
ON public.spare_parts FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert spare parts" 
ON public.spare_parts FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update spare parts" 
ON public.spare_parts FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete spare parts" 
ON public.spare_parts FOR DELETE 
USING (auth.role() = 'authenticated');

-- 16. Enable RLS and add policies for vehicle_images table
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view vehicle images" 
ON public.vehicle_images FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert vehicle images" 
ON public.vehicle_images FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update vehicle images" 
ON public.vehicle_images FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete vehicle images" 
ON public.vehicle_images FOR DELETE 
USING (auth.role() = 'authenticated');

-- 17. Enable RLS and add policies for trip_tracking table
ALTER TABLE public.trip_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to view trip tracking" 
ON public.trip_tracking FOR SELECT 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert trip tracking" 
ON public.trip_tracking FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update trip tracking" 
ON public.trip_tracking FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete trip tracking" 
ON public.trip_tracking FOR DELETE 
USING (auth.role() = 'authenticated');
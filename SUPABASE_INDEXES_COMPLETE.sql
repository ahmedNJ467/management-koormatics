-- ====================================================================
-- COMPLETE DATABASE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================================
-- This script creates all recommended indexes for the Koormatics Management System
-- Run this entire script in your Supabase SQL Editor
-- 
-- Instructions:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Paste this entire script
-- 4. Click "Run" or press Ctrl+Enter
-- 5. Wait for all indexes to be created
-- ====================================================================

-- ============================================
-- VEHICLES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON public.vehicles(registration);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON public.vehicles(fuel_type);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vehicles_insurance_expiry ON public.vehicles(insurance_expiry);

-- ============================================
-- TRIPS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_date ON public.trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_client_id ON public.trips(client_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_date_status ON public.trips(date, status);
CREATE INDEX IF NOT EXISTS idx_trips_service_type ON public.trips(service_type);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trips_escort_status ON public.trips(escort_status);

-- ============================================
-- INVOICES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON public.invoices(status, date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_quotation_id ON public.invoices(quotation_id);

-- ============================================
-- CONTRACTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON public.contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON public.contracts(start_date, end_date);

-- ============================================
-- FUEL LOGS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON public.fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON public.fuel_logs(date);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_fuel_type ON public.fuel_logs(fuel_type);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON public.fuel_logs(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_created_at ON public.fuel_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_fuel_management_id ON public.fuel_logs(fuel_management_id);

-- ============================================
-- MAINTENANCE TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_scheduled ON public.maintenance(next_scheduled) WHERE next_scheduled IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON public.maintenance(vehicle_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON public.maintenance(created_at DESC);

-- ============================================
-- DRIVERS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON public.drivers(license_expiry);
CREATE INDEX IF NOT EXISTS idx_drivers_license_number ON public.drivers(license_number);
CREATE INDEX IF NOT EXISTS idx_drivers_status_expiry ON public.drivers(status, license_expiry);
CREATE INDEX IF NOT EXISTS idx_drivers_is_vip ON public.drivers(is_vip);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON public.drivers(created_at DESC);

-- ============================================
-- INCIDENT REPORTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_reports_vehicle_id ON public.vehicle_incident_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON public.vehicle_incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON public.vehicle_incident_reports(incident_date);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON public.vehicle_incident_reports(severity);
CREATE INDEX IF NOT EXISTS idx_incident_reports_vehicle_date ON public.vehicle_incident_reports(vehicle_id, incident_date DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON public.vehicle_incident_reports(created_at DESC);

-- ============================================
-- QUOTATIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON public.quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON public.quotations(date);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON public.quotations(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotations_status_date ON public.quotations(status, date DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at DESC);

-- ============================================
-- CLIENTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_is_archived ON public.clients(is_archived);
CREATE INDEX IF NOT EXISTS idx_clients_has_active_contract ON public.clients(has_active_contract);

-- ============================================
-- SPARE PARTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON public.spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_manufacturer ON public.spare_parts(manufacturer);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON public.spare_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_status ON public.spare_parts(status);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category_manufacturer ON public.spare_parts(category, manufacturer);
CREATE INDEX IF NOT EXISTS idx_spare_parts_location ON public.spare_parts(location);
CREATE INDEX IF NOT EXISTS idx_spare_parts_created_at ON public.spare_parts(created_at DESC);

-- ============================================
-- VEHICLE INSPECTIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON public.vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON public.vehicle_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status ON public.vehicle_inspections(overall_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_inspector ON public.vehicle_inspections(inspector_name);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_date ON public.vehicle_inspections(vehicle_id, inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_created_at ON public.vehicle_inspections(created_at DESC);

-- ============================================
-- PAYROLL TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_payroll_employees_driver_id ON public.payroll_employees(driver_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_role ON public.payroll_employees(role);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_active ON public.payroll_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_employee_id ON public.payroll_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_pay_period ON public.payroll_records(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_records_created_at ON public.payroll_records(created_at DESC);

-- ============================================
-- VEHICLE LEASES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_contract_id ON public.vehicle_leases(contract_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_vehicle_id ON public.vehicle_leases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_contract_vehicle ON public.vehicle_leases(contract_id, vehicle_id);

-- ============================================
-- LEASE INVOICES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lease_invoices_lease_id ON public.lease_invoices(lease_id);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_status ON public.lease_invoices(status);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_due_date ON public.lease_invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_lease_invoices_created_at ON public.lease_invoices(created_at DESC);

-- ============================================
-- INVITATION LETTERS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invitation_letters_ref_number ON public.invitation_letters(ref_number);
CREATE INDEX IF NOT EXISTS idx_invitation_letters_date ON public.invitation_letters(date);
CREATE INDEX IF NOT EXISTS idx_invitation_letters_created_at ON public.invitation_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_invitation_letters_generated_by ON public.invitation_letters(generated_by);

-- ============================================
-- VEHICLE IMAGES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_images_created_at ON public.vehicle_images(created_at DESC);

-- ============================================
-- FUEL TANKS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fuel_tanks_fuel_type ON public.fuel_tanks(fuel_type);
CREATE INDEX IF NOT EXISTS idx_fuel_tanks_name ON public.fuel_tanks(name);

-- ============================================
-- TANK FILLS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_tank_fills_tank_id ON public.tank_fills(tank_id);
CREATE INDEX IF NOT EXISTS idx_tank_fills_fill_date ON public.tank_fills(fill_date);
CREATE INDEX IF NOT EXISTS idx_tank_fills_created_at ON public.tank_fills(created_at DESC);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query after creating indexes to verify they were created successfully:
-- 
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;
-- 
-- ============================================
-- PERFORMANCE MONITORING
-- ============================================
-- To check if indexes are being used, run EXPLAIN ANALYZE on your queries:
-- 
-- EXPLAIN ANALYZE
-- SELECT * FROM vehicles WHERE status = 'active';
-- 
-- Look for "Index Scan" in the output to confirm indexes are being used.
-- 
-- ============================================
-- NOTES
-- ============================================
-- 1. These indexes will significantly improve query performance
-- 2. Indexes use additional storage space, but the performance gains are worth it
-- 3. Monitor query performance after adding indexes
-- 4. Composite indexes (multiple columns) are created for frequently combined filters
-- 5. DESC indexes are used for date columns that are often sorted in descending order
-- 6. All indexes use "IF NOT EXISTS" so they won't fail if already created
-- 
-- ============================================
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ All database indexes have been created successfully!';
  RAISE NOTICE '📊 Run the verification query above to see all created indexes.';
  RAISE NOTICE '🚀 Your database queries should now perform significantly better.';
END $$;


-- Database Indexes for Performance Optimization
-- Run this script in your Supabase SQL editor to add recommended indexes
-- These indexes will significantly improve query performance

-- ============================================
-- VEHICLES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_type ON vehicles(type);
CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON vehicles(registration);
CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON vehicles(created_at DESC);

-- ============================================
-- TRIPS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_client_id ON trips(client_id);
CREATE INDEX IF NOT EXISTS idx_trips_date_status ON trips(date, status);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON trips(created_at DESC);

-- ============================================
-- INVOICES TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, date);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at DESC);

-- ============================================
-- CONTRACTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_contracts_dates ON contracts(start_date, end_date);

-- ============================================
-- FUEL LOGS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON fuel_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON fuel_logs(date);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_fuel_type ON fuel_logs(fuel_type);
CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON fuel_logs(vehicle_id, date DESC);

-- ============================================
-- MAINTENANCE TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_date_performed ON maintenance(date_performed);
CREATE INDEX IF NOT EXISTS idx_maintenance_next_due_date ON maintenance(next_due_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_maintenance_type ON maintenance(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON maintenance(vehicle_id, date_performed DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON maintenance(created_at DESC);

-- ============================================
-- DRIVERS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON drivers(license_expiry);
CREATE INDEX IF NOT EXISTS idx_drivers_status_expiry ON drivers(status, license_expiry);

-- ============================================
-- INCIDENT REPORTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_incident_reports_vehicle_id ON vehicle_incident_reports(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON vehicle_incident_reports(status);
CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON vehicle_incident_reports(incident_date);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON vehicle_incident_reports(severity);
CREATE INDEX IF NOT EXISTS idx_incident_reports_vehicle_date ON vehicle_incident_reports(vehicle_id, incident_date DESC);

-- ============================================
-- QUOTATIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(date);
CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON quotations(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotations_status_date ON quotations(status, date DESC);

-- ============================================
-- CLIENTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- ============================================
-- SPARE PARTS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_manufacturer ON spare_parts(manufacturer);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON spare_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category_manufacturer ON spare_parts(category, manufacturer);

-- ============================================
-- VEHICLE INSPECTIONS TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON vehicle_inspections(inspection_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status ON vehicle_inspections(overall_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_date ON vehicle_inspections(vehicle_id, inspection_date DESC);

-- ============================================
-- PAYROLL TABLE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_payroll_employees_driver_id ON payroll_employees(driver_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_role ON payroll_employees(role);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_active ON payroll_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_employee_id ON payroll_employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_pay_period ON payroll_records(pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_payroll_records_created_at ON payroll_records(created_at DESC);

-- ============================================
-- NOTES
-- ============================================
-- 1. These indexes will improve query performance significantly
-- 2. Indexes use storage space, but the performance gains are worth it
-- 3. Monitor query performance after adding indexes
-- 4. Consider adding composite indexes for frequently combined filters
-- 5. Use EXPLAIN ANALYZE in Supabase to check if indexes are being used

-- ============================================
-- VERIFY INDEXES
-- ============================================
-- Run this query to see all indexes:
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;


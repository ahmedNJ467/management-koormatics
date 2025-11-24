-- ====================================================================
-- SAFE DATABASE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ====================================================================
-- This script creates indexes only if the columns exist
-- Run this entire script in your Supabase SQL Editor
-- ====================================================================

-- ============================================
-- VEHICLES TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'type') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_type ON public.vehicles(type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'registration') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_registration ON public.vehicles(registration);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'fuel_type') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_fuel_type ON public.vehicles(fuel_type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_created_at ON public.vehicles(created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicles' AND column_name = 'insurance_expiry') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicles_insurance_expiry ON public.vehicles(insurance_expiry);
  END IF;
END $$;

-- ============================================
-- TRIPS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_date ON public.trips(date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON public.trips(vehicle_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_client_id ON public.trips(client_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'driver_id') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'date') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_date_status ON public.trips(date, status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'service_type') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_service_type ON public.trips(service_type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'escort_status') THEN
    CREATE INDEX IF NOT EXISTS idx_trips_escort_status ON public.trips(escort_status);
  END IF;
END $$;

-- ============================================
-- INVOICES TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON public.invoices(client_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
  END IF;
  -- Check for due_date column (it might not exist in some schemas)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'due_date') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'status') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON public.invoices(status, date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'quotation_id') THEN
    CREATE INDEX IF NOT EXISTS idx_invoices_quotation_id ON public.invoices(quotation_id);
  END IF;
END $$;

-- ============================================
-- CONTRACTS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'start_date') THEN
    CREATE INDEX IF NOT EXISTS idx_contracts_start_date ON public.contracts(start_date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'end_date') THEN
    CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON public.contracts(end_date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'contract_number') THEN
    CREATE INDEX IF NOT EXISTS idx_contracts_contract_number ON public.contracts(contract_number);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'start_date') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'contracts' AND column_name = 'end_date') THEN
    CREATE INDEX IF NOT EXISTS idx_contracts_dates ON public.contracts(start_date, end_date);
  END IF;
END $$;

-- ============================================
-- FUEL LOGS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_id ON public.fuel_logs(vehicle_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_date ON public.fuel_logs(date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'fuel_type') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_fuel_type ON public.fuel_logs(fuel_type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'vehicle_id') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_vehicle_date ON public.fuel_logs(vehicle_id, date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_created_at ON public.fuel_logs(created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_logs' AND column_name = 'fuel_management_id') THEN
    CREATE INDEX IF NOT EXISTS idx_fuel_logs_fuel_management_id ON public.fuel_logs(fuel_management_id);
  END IF;
END $$;

-- ============================================
-- MAINTENANCE TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_id ON public.maintenance(vehicle_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_date ON public.maintenance(date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'next_scheduled') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_next_scheduled ON public.maintenance(next_scheduled) WHERE next_scheduled IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'vehicle_id') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_vehicle_date ON public.maintenance(vehicle_id, date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON public.maintenance(created_at DESC);
  END IF;
END $$;

-- ============================================
-- DRIVERS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_status ON public.drivers(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'license_expiry') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_license_expiry ON public.drivers(license_expiry);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'license_number') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_license_number ON public.drivers(license_number);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'status') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'license_expiry') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_status_expiry ON public.drivers(status, license_expiry);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'is_vip') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_is_vip ON public.drivers(is_vip);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'drivers' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON public.drivers(created_at DESC);
  END IF;
END $$;

-- ============================================
-- INCIDENT REPORTS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_incident_reports' AND column_name = 'vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_incident_reports_vehicle_id ON public.vehicle_incident_reports(vehicle_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_incident_reports' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON public.vehicle_incident_reports(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_incident_reports' AND column_name = 'incident_date') THEN
    CREATE INDEX IF NOT EXISTS idx_incident_reports_date ON public.vehicle_incident_reports(incident_date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_incident_reports' AND column_name = 'severity') THEN
    CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON public.vehicle_incident_reports(severity);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_incident_reports' AND column_name = 'vehicle_id') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_incident_reports' AND column_name = 'incident_date') THEN
    CREATE INDEX IF NOT EXISTS idx_incident_reports_vehicle_date ON public.vehicle_incident_reports(vehicle_id, incident_date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_incident_reports' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_incident_reports_created_at ON public.vehicle_incident_reports(created_at DESC);
  END IF;
END $$;

-- ============================================
-- QUOTATIONS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'client_id') THEN
    CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON public.quotations(client_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_quotations_date ON public.quotations(date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'valid_until') THEN
    CREATE INDEX IF NOT EXISTS idx_quotations_valid_until ON public.quotations(valid_until);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'status') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'date') THEN
    CREATE INDEX IF NOT EXISTS idx_quotations_status_date ON public.quotations(status, date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quotations' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON public.quotations(created_at DESC);
  END IF;
END $$;

-- ============================================
-- CLIENTS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'name') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_name ON public.clients(name);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'type') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_type ON public.clients(type);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_created_at ON public.clients(created_at DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'is_archived') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_is_archived ON public.clients(is_archived);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'clients' AND column_name = 'has_active_contract') THEN
    CREATE INDEX IF NOT EXISTS idx_clients_has_active_contract ON public.clients(has_active_contract);
  END IF;
END $$;

-- ============================================
-- SPARE PARTS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'category') THEN
    CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON public.spare_parts(category);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'manufacturer') THEN
    CREATE INDEX IF NOT EXISTS idx_spare_parts_manufacturer ON public.spare_parts(manufacturer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'part_number') THEN
    CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON public.spare_parts(part_number);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_spare_parts_status ON public.spare_parts(status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'category') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'manufacturer') THEN
    CREATE INDEX IF NOT EXISTS idx_spare_parts_category_manufacturer ON public.spare_parts(category, manufacturer);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'location') THEN
    CREATE INDEX IF NOT EXISTS idx_spare_parts_location ON public.spare_parts(location);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'spare_parts' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_spare_parts_created_at ON public.spare_parts(created_at DESC);
  END IF;
END $$;

-- ============================================
-- VEHICLE INSPECTIONS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_inspections' AND column_name = 'vehicle_id') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON public.vehicle_inspections(vehicle_id);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_inspections' AND column_name = 'inspection_date') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_date ON public.vehicle_inspections(inspection_date);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_inspections' AND column_name = 'overall_status') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_status ON public.vehicle_inspections(overall_status);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_inspections' AND column_name = 'inspector_name') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_inspector ON public.vehicle_inspections(inspector_name);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_inspections' AND column_name = 'vehicle_id') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_inspections' AND column_name = 'inspection_date') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_date ON public.vehicle_inspections(vehicle_id, inspection_date DESC);
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_inspections' AND column_name = 'created_at') THEN
    CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_created_at ON public.vehicle_inspections(created_at DESC);
  END IF;
END $$;

-- ============================================
-- PAYROLL TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_employees') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_employees' AND column_name = 'driver_id') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_employees_driver_id ON public.payroll_employees(driver_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_employees' AND column_name = 'role') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_employees_role ON public.payroll_employees(role);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_employees' AND column_name = 'is_active') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_employees_active ON public.payroll_employees(is_active);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_employees' AND column_name = 'employee_id') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_employees_employee_id ON public.payroll_employees(employee_id);
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payroll_records') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_records' AND column_name = 'employee_id') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_records' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records(status);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_records' AND column_name = 'pay_period_start') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_records' AND column_name = 'pay_period_end') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_records_pay_period ON public.payroll_records(pay_period_start, pay_period_end);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payroll_records' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_payroll_records_created_at ON public.payroll_records(created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================
-- VEHICLE LEASES TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_leases') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_leases' AND column_name = 'contract_id') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_leases_contract_id ON public.vehicle_leases(contract_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_leases' AND column_name = 'vehicle_id') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_leases_vehicle_id ON public.vehicle_leases(vehicle_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_leases' AND column_name = 'contract_id') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_leases' AND column_name = 'vehicle_id') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_leases_contract_vehicle ON public.vehicle_leases(contract_id, vehicle_id);
    END IF;
  END IF;
END $$;

-- ============================================
-- LEASE INVOICES TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lease_invoices') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lease_invoices' AND column_name = 'lease_id') THEN
      CREATE INDEX IF NOT EXISTS idx_lease_invoices_lease_id ON public.lease_invoices(lease_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lease_invoices' AND column_name = 'status') THEN
      CREATE INDEX IF NOT EXISTS idx_lease_invoices_status ON public.lease_invoices(status);
    END IF;
    -- Check for due_date column (might be named differently)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lease_invoices' AND column_name = 'due_date') THEN
      CREATE INDEX IF NOT EXISTS idx_lease_invoices_due_date ON public.lease_invoices(due_date);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lease_invoices' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_lease_invoices_created_at ON public.lease_invoices(created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================
-- INVITATION LETTERS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'invitation_letters') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitation_letters' AND column_name = 'ref_number') THEN
      CREATE INDEX IF NOT EXISTS idx_invitation_letters_ref_number ON public.invitation_letters(ref_number);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitation_letters' AND column_name = 'date') THEN
      CREATE INDEX IF NOT EXISTS idx_invitation_letters_date ON public.invitation_letters(date);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitation_letters' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_invitation_letters_created_at ON public.invitation_letters(created_at DESC);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'invitation_letters' AND column_name = 'generated_by') THEN
      CREATE INDEX IF NOT EXISTS idx_invitation_letters_generated_by ON public.invitation_letters(generated_by);
    END IF;
  END IF;
END $$;

-- ============================================
-- VEHICLE IMAGES TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicle_images') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_images' AND column_name = 'vehicle_id') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vehicle_images' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_vehicle_images_created_at ON public.vehicle_images(created_at DESC);
    END IF;
  END IF;
END $$;

-- ============================================
-- FUEL TANKS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'fuel_tanks') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_tanks' AND column_name = 'fuel_type') THEN
      CREATE INDEX IF NOT EXISTS idx_fuel_tanks_fuel_type ON public.fuel_tanks(fuel_type);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fuel_tanks' AND column_name = 'name') THEN
      CREATE INDEX IF NOT EXISTS idx_fuel_tanks_name ON public.fuel_tanks(name);
    END IF;
  END IF;
END $$;

-- ============================================
-- TANK FILLS TABLE INDEXES
-- ============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tank_fills') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tank_fills' AND column_name = 'tank_id') THEN
      CREATE INDEX IF NOT EXISTS idx_tank_fills_tank_id ON public.tank_fills(tank_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tank_fills' AND column_name = 'fill_date') THEN
      CREATE INDEX IF NOT EXISTS idx_tank_fills_fill_date ON public.tank_fills(fill_date);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tank_fills' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_tank_fills_created_at ON public.tank_fills(created_at DESC);
    END IF;
  END IF;
END $$;

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
-- COMPLETION MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ All database indexes have been created successfully!';
  RAISE NOTICE '📊 Run the verification query above to see all created indexes.';
  RAISE NOTICE '🚀 Your database queries should now perform significantly better.';
END $$;


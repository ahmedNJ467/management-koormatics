-- Create employee roles enum
CREATE TYPE employee_role AS ENUM ('driver', 'mechanic', 'admin', 'manager', 'other');

-- Create payroll status enum
CREATE TYPE payroll_status AS ENUM ('pending', 'approved', 'paid', 'cancelled');

-- Create payroll_employees table
CREATE TABLE IF NOT EXISTS public.payroll_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  employee_id TEXT UNIQUE,
  role employee_role NOT NULL DEFAULT 'driver',
  driver_id UUID REFERENCES public.drivers(id) ON DELETE SET NULL,
  base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  bank_account TEXT,
  bank_name TEXT,
  contact TEXT,
  email TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payroll_records table
CREATE TABLE IF NOT EXISTS public.payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.payroll_employees(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  base_salary DECIMAL(10, 2) NOT NULL DEFAULT 0,
  hours_worked DECIMAL(5, 2),
  overtime_hours DECIMAL(5, 2) DEFAULT 0,
  overtime_rate DECIMAL(10, 2),
  bonuses DECIMAL(10, 2) DEFAULT 0,
  deductions DECIMAL(10, 2) DEFAULT 0,
  allowances DECIMAL(10, 2) DEFAULT 0,
  gross_pay DECIMAL(10, 2) NOT NULL,
  net_pay DECIMAL(10, 2) NOT NULL,
  status payroll_status DEFAULT 'pending',
  payment_date DATE,
  payment_method TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_pay_period CHECK (pay_period_end >= pay_period_start)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payroll_employees_driver_id ON public.payroll_employees(driver_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_role ON public.payroll_employees(role);
CREATE INDEX IF NOT EXISTS idx_payroll_employees_active ON public.payroll_employees(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_records_employee_id ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_status ON public.payroll_records(status);
CREATE INDEX IF NOT EXISTS idx_payroll_records_pay_period ON public.payroll_records(pay_period_start, pay_period_end);

-- Enable RLS
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll_employees
CREATE POLICY "Authenticated users can view payroll employees"
  ON public.payroll_employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payroll employees"
  ON public.payroll_employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update payroll employees"
  ON public.payroll_employees FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete payroll employees"
  ON public.payroll_employees FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for payroll_records
CREATE POLICY "Authenticated users can view payroll records"
  ON public.payroll_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert payroll records"
  ON public.payroll_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update payroll records"
  ON public.payroll_records FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete payroll records"
  ON public.payroll_records FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_payroll_employees_updated_at
  BEFORE UPDATE ON public.payroll_employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_records_updated_at
  BEFORE UPDATE ON public.payroll_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


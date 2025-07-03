-- Create enum types for vehicle leases
CREATE TYPE lease_status AS ENUM ('active', 'pending', 'expired', 'terminated', 'upcoming');
CREATE TYPE payment_status AS ENUM ('current', 'overdue', 'partial', 'paid_ahead');

-- Create vehicle_leases table
CREATE TABLE IF NOT EXISTS vehicle_leases (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    lessee_name VARCHAR(255) NOT NULL,
    lessee_email VARCHAR(255) NOT NULL,
    lessee_phone VARCHAR(50) NOT NULL,
    lessee_address TEXT NOT NULL,
    lease_start_date DATE NOT NULL,
    lease_end_date DATE NOT NULL,
    monthly_rate DECIMAL(10,2) NOT NULL CHECK (monthly_rate > 0),
    security_deposit DECIMAL(10,2) DEFAULT 0 CHECK (security_deposit >= 0),
    mileage_limit INTEGER NOT NULL CHECK (mileage_limit > 0),
    excess_mileage_rate DECIMAL(5,2) DEFAULT 0 CHECK (excess_mileage_rate >= 0),
    lease_status lease_status DEFAULT 'pending',
    payment_status payment_status DEFAULT 'current',
    contract_number VARCHAR(50) NOT NULL UNIQUE,
    notes TEXT,
    insurance_required BOOLEAN DEFAULT true,
    maintenance_included BOOLEAN DEFAULT false,
    early_termination_fee DECIMAL(10,2) DEFAULT 0 CHECK (early_termination_fee >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_vehicle_id ON vehicle_leases(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_lease_status ON vehicle_leases(lease_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_payment_status ON vehicle_leases(payment_status);
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_contract_number ON vehicle_leases(contract_number);
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_lease_dates ON vehicle_leases(lease_start_date, lease_end_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_lessee_email ON vehicle_leases(lessee_email);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_vehicle_leases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicle_leases_updated_at
    BEFORE UPDATE ON vehicle_leases
    FOR EACH ROW
    EXECUTE FUNCTION update_vehicle_leases_updated_at();

-- Add constraint to ensure lease end date is after start date
ALTER TABLE vehicle_leases 
ADD CONSTRAINT check_lease_dates 
CHECK (lease_end_date > lease_start_date);

-- Add constraint to ensure contract number format
ALTER TABLE vehicle_leases 
ADD CONSTRAINT check_contract_number_format 
CHECK (contract_number ~ '^LSE-[0-9]+$');

-- Enable Row Level Security
ALTER TABLE vehicle_leases ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all vehicle leases" ON vehicle_leases
    FOR SELECT USING (true);

CREATE POLICY "Users can insert vehicle leases" ON vehicle_leases
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update vehicle leases" ON vehicle_leases
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete vehicle leases" ON vehicle_leases
    FOR DELETE USING (true);

-- Add comments for documentation
COMMENT ON TABLE vehicle_leases IS 'Vehicle lease agreements and customer information';
COMMENT ON COLUMN vehicle_leases.vehicle_id IS 'Reference to the leased vehicle';
COMMENT ON COLUMN vehicle_leases.contract_number IS 'Unique lease contract identifier (format: LSE-XXXXXX)';
COMMENT ON COLUMN vehicle_leases.monthly_rate IS 'Monthly lease payment amount in USD';
COMMENT ON COLUMN vehicle_leases.security_deposit IS 'Security deposit amount in USD';
COMMENT ON COLUMN vehicle_leases.mileage_limit IS 'Annual mileage limit in miles';
COMMENT ON COLUMN vehicle_leases.excess_mileage_rate IS 'Charge per mile over the limit in USD';
COMMENT ON COLUMN vehicle_leases.early_termination_fee IS 'Fee for early lease termination in USD';
COMMENT ON COLUMN vehicle_leases.insurance_required IS 'Whether lessee must maintain insurance';
COMMENT ON COLUMN vehicle_leases.maintenance_included IS 'Whether maintenance is included in lease'; 
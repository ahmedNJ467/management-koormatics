-- UPDATE EXISTING VEHICLE_LEASES TABLE TO NEW SCHEMA
-- Add new columns if they don't exist
ALTER TABLE vehicle_leases ADD COLUMN IF NOT EXISTS contract_id UUID;
ALTER TABLE vehicle_leases ADD COLUMN IF NOT EXISTS daily_rate DECIMAL(10,2);

-- Add new constraint for daily_rate
DO $$ BEGIN
    ALTER TABLE vehicle_leases ADD CONSTRAINT check_daily_rate_positive CHECK (daily_rate > 0);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update indexes
DROP INDEX IF EXISTS idx_vehicle_leases_contract_number;
CREATE INDEX IF NOT EXISTS idx_vehicle_leases_contract_id ON vehicle_leases(contract_id);

-- Show final verification
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_leases' AND column_name = 'daily_rate') 
        THEN 'SUCCESS: daily_rate column exists!'
        ELSE 'ERROR: daily_rate column missing'
    END as daily_rate_check;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vehicle_leases' AND column_name = 'contract_id') 
        THEN 'SUCCESS: contract_id column exists!'
        ELSE 'ERROR: contract_id column missing'
    END as contract_id_check;

-- Add contract_number column to contracts table
ALTER TABLE contracts
ADD COLUMN IF NOT EXISTS contract_number VARCHAR(20);

-- Populate existing rows with generated numbers if they are NULL
-- This simple generator creates numbers like CYYMMDD-XXXX where XXXX is random 4-digit
UPDATE contracts
SET contract_number = 'C' || to_char(NOW(), 'YYMMDD') || '-' || lpad((floor(random()*9000)+1000)::text, 4, '0')
WHERE contract_number IS NULL;

-- Ensure contract_number is unique (Postgres doesn't support IF NOT EXISTS for constraints)
CREATE UNIQUE INDEX IF NOT EXISTS contracts_contract_number_unique_idx
  ON contracts(contract_number);

-- (Optional) Enforce NOT NULL once all rows have a number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts'
      AND column_name = 'contract_number'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE contracts ALTER COLUMN contract_number SET NOT NULL;
  END IF;
END $$; 
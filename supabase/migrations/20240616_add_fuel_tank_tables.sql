-- Table for fuel tanks (petrol, diesel)
CREATE TABLE IF NOT EXISTS public.fuel_tanks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel')),
  capacity NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Table for tank fill events
CREATE TABLE IF NOT EXISTS public.tank_fills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tank_id uuid REFERENCES public.fuel_tanks(id) ON DELETE CASCADE,
  fill_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Add tank_id to fuel_logs for tracking which tank dispensed the fuel
ALTER TABLE public.fuel_logs ADD COLUMN IF NOT EXISTS tank_id uuid REFERENCES public.fuel_tanks(id); 
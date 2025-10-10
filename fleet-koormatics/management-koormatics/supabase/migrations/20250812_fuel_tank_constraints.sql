-- Enforce fuel type compatibility and prevent overdrawing tanks

-- 1) Create enum for fuel types if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'fuel_type_enum'
  ) THEN
    CREATE TYPE fuel_type_enum AS ENUM ('petrol', 'diesel', 'cng');
  END IF;
END $$;

-- 2) Ensure fuel_tanks.fuel_type uses enum (optional; skip if already typed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fuel_tanks'
      AND column_name = 'fuel_type'
      AND udt_name <> 'fuel_type_enum'
  ) THEN
    ALTER TABLE public.fuel_tanks
      ALTER COLUMN fuel_type TYPE fuel_type_enum USING fuel_type::fuel_type_enum;
  END IF;
END $$;

-- 3) Ensure fuel_logs.fuel_type uses enum (optional; skip if already typed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fuel_logs'
      AND column_name = 'fuel_type'
      AND udt_name <> 'fuel_type_enum'
  ) THEN
    ALTER TABLE public.fuel_logs
      ALTER COLUMN fuel_type TYPE fuel_type_enum USING fuel_type::fuel_type_enum;
  END IF;
END $$;

-- 4) Add a check constraint to enforce that when tank_id is present,
--    fuel_logs.fuel_type must match fuel_tanks.fuel_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fuel_logs_tank_fuel_type_match'
  ) THEN
    ALTER TABLE public.fuel_logs
    ADD CONSTRAINT fuel_logs_tank_fuel_type_match
    CHECK (
      tank_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.fuel_tanks t
        WHERE t.id = tank_id AND t.fuel_type = fuel_type
      )
    );
  END IF;
END $$;

-- 5) Create a stable function to compute available liters in a tank
CREATE OR REPLACE FUNCTION public.get_tank_available_liters(p_tank_id uuid)
RETURNS numeric AS $$
DECLARE
  v_filled numeric := 0;
  v_dispensed numeric := 0;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO v_filled
  FROM public.tank_fills
  WHERE tank_id = p_tank_id;

  SELECT COALESCE(SUM(volume), 0) INTO v_dispensed
  FROM public.fuel_logs
  WHERE tank_id = p_tank_id;

  RETURN v_filled - v_dispensed;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper RPC used by the app for aggregation
CREATE OR REPLACE FUNCTION public.get_tank_dispensed(p_tank_id uuid)
RETURNS numeric AS $$
BEGIN
  RETURN COALESCE((SELECT SUM(volume) FROM public.fuel_logs WHERE tank_id = p_tank_id), 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- 6) Add a constraint via trigger to prevent overdrawing tanks
--    when inserting or updating a fuel_log that references a tank
CREATE OR REPLACE FUNCTION public.prevent_tank_overdraw()
RETURNS trigger AS $$
DECLARE
  v_available numeric;
BEGIN
  IF NEW.tank_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Compute available liters BEFORE applying this log
  v_available := public.get_tank_available_liters(NEW.tank_id);

  -- If updating, add back the old volume if the same tank to simulate net change
  IF TG_OP = 'UPDATE' AND OLD.tank_id = NEW.tank_id THEN
    v_available := v_available + COALESCE(OLD.volume, 0);
  END IF;

  IF COALESCE(NEW.volume, 0) > v_available THEN
    RAISE EXCEPTION 'Not enough fuel in tank. Available: % L, attempted: % L.', v_available, NEW.volume
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_tank_overdraw'
  ) THEN
    CREATE TRIGGER trg_prevent_tank_overdraw
    BEFORE INSERT OR UPDATE ON public.fuel_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_tank_overdraw();
  END IF;
END $$;



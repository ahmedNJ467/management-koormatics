-- Add actual pickup and dropoff time fields to trips table
-- This will enable proper on-time performance tracking

ALTER TABLE public.trips 
ADD COLUMN actual_pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN actual_dropoff_time TIMESTAMP WITH TIME ZONE;

-- Add indexes for better query performance
CREATE INDEX idx_trips_actual_pickup_time ON public.trips(actual_pickup_time);
CREATE INDEX idx_trips_actual_dropoff_time ON public.trips(actual_dropoff_time);

-- Add a computed column for on-time status (optional)
-- This can be calculated in the application layer instead
-- ALTER TABLE public.trips ADD COLUMN is_on_time BOOLEAN GENERATED ALWAYS AS (
--   CASE 
--     WHEN actual_pickup_time IS NULL OR time IS NULL THEN NULL
--     WHEN actual_pickup_time <= (date || ' ' || time)::timestamp THEN true
--     ELSE false
--   END
-- ) STORED; 
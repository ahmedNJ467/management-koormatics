
-- Create database functions for trip assignments and messages

-- Function to insert a trip assignment
CREATE OR REPLACE FUNCTION public.insert_trip_assignment(
  p_trip_id UUID,
  p_driver_id UUID,
  p_status TEXT DEFAULT 'pending',
  p_notes TEXT DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.trip_assignments (
    trip_id, 
    driver_id, 
    assigned_at, 
    status, 
    notes
  )
  VALUES (
    p_trip_id,
    p_driver_id,
    NOW(),
    p_status,
    p_notes
  );
END;
$$;

-- Function to insert a trip message
CREATE OR REPLACE FUNCTION public.insert_trip_message(
  p_trip_id UUID,
  p_sender_type TEXT,
  p_sender_name TEXT,
  p_message TEXT,
  p_is_read BOOLEAN DEFAULT false
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.trip_messages (
    trip_id, 
    sender_type, 
    sender_name, 
    message, 
    timestamp, 
    is_read
  )
  VALUES (
    p_trip_id,
    p_sender_type,
    p_sender_name,
    p_message,
    NOW(),
    p_is_read
  );
END;
$$;

-- Function to update a part's notes
CREATE OR REPLACE FUNCTION public.update_part_notes(
  part_id UUID,
  notes_value TEXT
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.spare_parts
  SET notes = notes_value
  WHERE id = part_id;
END;
$$;


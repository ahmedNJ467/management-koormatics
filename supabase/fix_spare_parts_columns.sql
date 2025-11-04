-- Fix spare_parts table: Add missing columns and update RPC function
-- Run this in the Supabase SQL Editor

-- Step 1: Add 'notes' column to spare_parts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'spare_parts' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE public.spare_parts 
        ADD COLUMN notes TEXT;
        
        RAISE NOTICE 'Added notes column to spare_parts table';
    ELSE
        RAISE NOTICE 'notes column already exists in spare_parts table';
    END IF;
END $$;

-- Step 2: Ensure 'part_image' column exists (should already exist based on types.ts, but check anyway)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'spare_parts' 
        AND column_name = 'part_image'
    ) THEN
        ALTER TABLE public.spare_parts 
        ADD COLUMN part_image TEXT;
        
        RAISE NOTICE 'Added part_image column to spare_parts table';
    ELSE
        RAISE NOTICE 'part_image column already exists in spare_parts table';
    END IF;
END $$;

-- Step 3: Create or replace the update_part_notes RPC function
-- This function checks if the notes column exists before updating
CREATE OR REPLACE FUNCTION public.update_part_notes(
  part_id UUID,
  notes_value TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if notes column exists before updating
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'spare_parts' 
    AND column_name = 'notes'
  ) THEN
    UPDATE public.spare_parts
    SET notes = notes_value
    WHERE id = part_id;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Part with id % not found', part_id;
    END IF;
  ELSE
    -- If notes column doesn't exist, silently do nothing
    -- This prevents errors when the column hasn't been added to the database
    RAISE NOTICE 'notes column does not exist in spare_parts table';
  END IF;
END;
$$;

-- Step 4: Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION public.update_part_notes(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_part_notes(UUID, TEXT) TO anon;

-- Verification: Check the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'spare_parts'
ORDER BY ordinal_position;


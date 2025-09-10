-- Fix interest points delete policy to allow deletion of points without created_by
-- This allows deletion of sample data and points created by system

-- Drop the existing restrictive delete policy
DROP POLICY IF EXISTS "Allow users to delete their own interest points" ON interest_points;

-- Create a more permissive delete policy for authenticated users
CREATE POLICY "Allow authenticated users to delete interest points" ON interest_points
  FOR DELETE USING (auth.role() = 'authenticated');

-- Also update the update policy to be more permissive
DROP POLICY IF EXISTS "Allow users to update their own interest points" ON interest_points;

CREATE POLICY "Allow authenticated users to update interest points" ON interest_points
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Update sample data to include created_by field for better data integrity
-- First, get a user ID (we'll use the first authenticated user or create a system user)
DO $$
DECLARE
    system_user_id UUID;
BEGIN
    -- Try to get the first authenticated user
    SELECT id INTO system_user_id FROM auth.users LIMIT 1;
    
    -- If no users exist, we'll leave created_by as NULL for now
    IF system_user_id IS NOT NULL THEN
        -- Update existing sample data to have created_by field
        UPDATE interest_points 
        SET created_by = system_user_id 
        WHERE created_by IS NULL;
    END IF;
END $$;

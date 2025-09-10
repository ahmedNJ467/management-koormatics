-- Fix interest points delete policy to allow deletion of points without created_by
-- This allows deletion of sample data and points created by system

-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Allow users to delete their own interest points" ON interest_points;
DROP POLICY IF EXISTS "Allow authenticated users to delete interest points" ON interest_points;
DROP POLICY IF EXISTS "Allow users to update their own interest points" ON interest_points;
DROP POLICY IF EXISTS "Allow authenticated users to update interest points" ON interest_points;
DROP POLICY IF EXISTS "Allow authenticated users to insert interest points" ON interest_points;
DROP POLICY IF EXISTS "Allow users to insert their own interest points" ON interest_points;

-- Create new permissive policies for authenticated users
CREATE POLICY "Allow authenticated users to insert interest points" ON interest_points
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete interest points" ON interest_points
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update interest points" ON interest_points
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Update sample data to include created_by field for better data integrity
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

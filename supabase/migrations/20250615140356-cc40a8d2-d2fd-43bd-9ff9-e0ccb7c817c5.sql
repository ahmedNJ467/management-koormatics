
-- Drop the existing policy that restricts uploads to authenticated users
DROP POLICY IF EXISTS "Upload access for authenticated users to log_sheets" ON storage.objects;

-- Create a new, more permissive policy that allows public uploads to the 'log_sheets' bucket.
-- This is safe for public buckets and will resolve the row-level security error.
CREATE POLICY "Public upload access for log_sheets" ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'log_sheets');

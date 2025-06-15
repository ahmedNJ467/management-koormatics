
-- Add log_sheet_url to trips table to store the URL of the signed log sheet
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS log_sheet_url TEXT;

-- Create a storage bucket for log sheets if it doesn't exist
-- This bucket will be public to allow easy access to the uploaded files
INSERT INTO storage.buckets (id, name, public)
VALUES ('log_sheets', 'log_sheets', true)
ON CONFLICT (id) DO NOTHING;

-- This policy allows anyone to view files in the bucket.
CREATE POLICY "Public read access for log_sheets" ON storage.objects
FOR SELECT TO public USING ( bucket_id = 'log_sheets' );

-- This policy allows any authenticated user to upload files to the bucket.
CREATE POLICY "Upload access for authenticated users to log_sheets" ON storage.objects
FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'log_sheets' );

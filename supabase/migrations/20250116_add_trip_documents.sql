-- Add document fields to trips table for airport services
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS passport_documents JSONB;
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS invitation_documents JSONB;

-- Create a storage bucket for trip documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('trip_documents', 'trip_documents', true)
ON CONFLICT (id) DO NOTHING;

-- This policy allows anyone to view files in the bucket.
CREATE POLICY "Public read access for trip_documents" ON storage.objects
FOR SELECT TO public USING ( bucket_id = 'trip_documents' );

-- This policy allows any authenticated user to upload files to the bucket.
CREATE POLICY "Upload access for authenticated users to trip_documents" ON storage.objects
FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'trip_documents' );

-- This policy allows authenticated users to update/delete their own files
CREATE POLICY "Users can update their own trip documents" ON storage.objects
FOR UPDATE TO authenticated USING ( bucket_id = 'trip_documents' );

CREATE POLICY "Users can delete their own trip documents" ON storage.objects
FOR DELETE TO authenticated USING ( bucket_id = 'trip_documents' );

-- Add comments for documentation
COMMENT ON COLUMN public.trips.passport_documents IS 'JSON array of passport document objects with name, url, passenger_name fields for airport services';
COMMENT ON COLUMN public.trips.invitation_documents IS 'JSON array of invitation letter document objects with name, url, passenger_name fields for airport services'; 
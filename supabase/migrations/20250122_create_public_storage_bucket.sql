-- Create public storage bucket for interest point icons
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'public',
  'public',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
);

-- Create RLS policies for the public bucket
CREATE POLICY "Public bucket is publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'public');

CREATE POLICY "Authenticated users can upload to public bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'public' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own files in public bucket" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'public' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own files in public bucket" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'public' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

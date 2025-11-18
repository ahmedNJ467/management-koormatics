-- Create storage buckets for driver files
-- This migration creates the necessary storage buckets for driver avatars, documents, and airport IDs

-- =====================================================
-- 1. CREATE DRIVER STORAGE BUCKETS
-- =====================================================

-- Create driver-avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-avatars',
  'driver-avatars',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create driver-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-documents',
  'driver-documents',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create driver-airport-ids bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'driver-airport-ids',
  'driver-airport-ids',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. CREATE RLS POLICIES FOR DRIVER BUCKETS
-- =====================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update driver avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete driver avatars" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can view driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update driver documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete driver documents" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can view driver airport ids" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload driver airport ids" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update driver airport ids" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete driver airport ids" ON storage.objects;

-- Policies for driver-avatars bucket
CREATE POLICY "Authenticated users can view driver avatars" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated' AND bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated users can upload driver avatars" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated users can update driver avatars" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated users can delete driver avatars" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'driver-avatars');

-- Policies for driver-documents bucket
CREATE POLICY "Authenticated users can view driver documents" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated' AND bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can upload driver documents" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can update driver documents" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can delete driver documents" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'driver-documents');

-- Policies for driver-airport-ids bucket
CREATE POLICY "Authenticated users can view driver airport ids" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated' AND bucket_id = 'driver-airport-ids');

CREATE POLICY "Authenticated users can upload driver airport ids" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'driver-airport-ids');

CREATE POLICY "Authenticated users can update driver airport ids" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'driver-airport-ids');

CREATE POLICY "Authenticated users can delete driver airport ids" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'driver-airport-ids');


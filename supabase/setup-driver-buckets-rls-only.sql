-- RLS Policies for Driver Storage Buckets
-- Run this AFTER creating the buckets manually in Supabase Dashboard > Storage
-- This file only contains the RLS policies, assuming buckets are created via UI

-- =====================================================
-- CREATE RLS POLICIES FOR DRIVER BUCKETS
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
  FOR SELECT USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated users can upload driver avatars" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated users can update driver avatars" ON storage.objects
  FOR UPDATE USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-avatars');

CREATE POLICY "Authenticated users can delete driver avatars" ON storage.objects
  FOR DELETE USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-avatars');

-- Policies for driver-documents bucket
CREATE POLICY "Authenticated users can view driver documents" ON storage.objects
  FOR SELECT USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can upload driver documents" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can update driver documents" ON storage.objects
  FOR UPDATE USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can delete driver documents" ON storage.objects
  FOR DELETE USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-documents');

-- Policies for driver-airport-ids bucket
CREATE POLICY "Authenticated users can view driver airport ids" ON storage.objects
  FOR SELECT USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-airport-ids');

CREATE POLICY "Authenticated users can upload driver airport ids" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'driver-airport-ids');

CREATE POLICY "Authenticated users can update driver airport ids" ON storage.objects
  FOR UPDATE USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-airport-ids');

CREATE POLICY "Authenticated users can delete driver airport ids" ON storage.objects
  FOR DELETE USING (auth.uid() IS NOT NULL AND bucket_id = 'driver-airport-ids');


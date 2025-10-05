-- Fix storage RLS policies for images bucket
-- This migration ensures authenticated users can upload files to the images bucket

-- =====================================================
-- 1. CREATE STORAGE BUCKET IF NOT EXISTS
-- =====================================================

-- Create the images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. DROP EXISTING RLS POLICIES
-- =====================================================

-- Drop existing policies on storage.objects
DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

-- =====================================================
-- 3. CREATE NEW RLS POLICIES
-- =====================================================

-- Allow authenticated users to view all images
CREATE POLICY "Authenticated users can view images" ON storage.objects
  FOR SELECT USING (auth.role() = 'authenticated' AND bucket_id = 'images');

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND bucket_id = 'images');

-- Allow authenticated users to update images
CREATE POLICY "Authenticated users can update images" ON storage.objects
  FOR UPDATE USING (auth.role() = 'authenticated' AND bucket_id = 'images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images" ON storage.objects
  FOR DELETE USING (auth.role() = 'authenticated' AND bucket_id = 'images');

-- =====================================================
-- 4. ENABLE RLS ON STORAGE OBJECTS
-- =====================================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. VERIFY BUCKET CONFIGURATION
-- =====================================================

-- Check if the bucket exists and is properly configured
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets 
WHERE id = 'images';

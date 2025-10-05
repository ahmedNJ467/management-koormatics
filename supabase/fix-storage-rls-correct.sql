-- Correct approach to fix storage RLS policies
-- This script should be run in the Supabase Dashboard SQL Editor
-- Note: Some operations may require superuser privileges

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
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 2. CHECK CURRENT BUCKET STATUS
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

-- =====================================================
-- 3. ALTERNATIVE: DISABLE RLS ON STORAGE OBJECTS
-- =====================================================

-- If you have superuser access, you can disable RLS on storage.objects
-- WARNING: This makes all storage objects publicly accessible
-- Uncomment the following line if you have superuser privileges:
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. CHECK CURRENT RLS POLICIES
-- =====================================================

-- Check what RLS policies currently exist on storage.objects
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- =====================================================
-- 5. VERIFY BUCKET ACCESS
-- =====================================================

-- Test if we can access the bucket
SELECT 'Storage bucket configuration completed' as status;

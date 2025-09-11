-- Fix RLS policies for invitation_letters table
-- This ensures users can properly insert, view, update, and delete their own invitation letters

-- First, disable RLS temporarily to clean up existing policies
ALTER TABLE public.invitation_letters DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own invitation letters" ON public.invitation_letters;
DROP POLICY IF EXISTS "Users can create invitation letters" ON public.invitation_letters;
DROP POLICY IF EXISTS "Users can update their own invitation letters" ON public.invitation_letters;
DROP POLICY IF EXISTS "Users can delete their own invitation letters" ON public.invitation_letters;

-- Re-enable RLS
ALTER TABLE public.invitation_letters ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper syntax
CREATE POLICY "Users can view their own invitation letters" 
ON public.invitation_letters 
FOR SELECT 
TO authenticated 
USING (generated_by = auth.uid());

CREATE POLICY "Users can create invitation letters" 
ON public.invitation_letters 
FOR INSERT 
TO authenticated 
WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Users can update their own invitation letters" 
ON public.invitation_letters 
FOR UPDATE 
TO authenticated 
USING (generated_by = auth.uid())
WITH CHECK (generated_by = auth.uid());

CREATE POLICY "Users can delete their own invitation letters" 
ON public.invitation_letters 
FOR DELETE 
TO authenticated 
USING (generated_by = auth.uid());

-- Also fix storage policies for the invitation-letters bucket
-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can view their own invitation letter PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload invitation letter PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own invitation letter PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own invitation letter PDFs" ON storage.objects;

-- Create new storage policies with proper folder structure
CREATE POLICY "Users can view their own invitation letter PDFs" 
ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'invitation-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can upload invitation letter PDFs" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'invitation-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their own invitation letter PDFs" 
ON storage.objects 
FOR UPDATE 
TO authenticated 
USING (bucket_id = 'invitation-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own invitation letter PDFs" 
ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'invitation-letters' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'invitation_letters';

-- Verify storage policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

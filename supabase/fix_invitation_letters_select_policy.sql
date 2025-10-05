-- Fix missing SELECT policy for invitation_letters table
-- This allows users to view their own invitation letters

-- Check if the policy already exists and drop it if it does
DROP POLICY IF EXISTS "Users can view their own invitation letters" ON public.invitation_letters;

-- Create the SELECT policy
CREATE POLICY "Users can view their own invitation letters" 
ON public.invitation_letters 
FOR SELECT 
TO authenticated 
USING (generated_by = auth.uid());

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'invitation_letters' AND policyname = 'Users can view their own invitation letters';

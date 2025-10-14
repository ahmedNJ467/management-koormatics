-- Fix invitation_letters table schema to match frontend requirements
-- This adds the missing columns that are causing 400 errors

-- Add missing columns to invitation_letters table
ALTER TABLE public.invitation_letters 
ADD COLUMN IF NOT EXISTS file_name TEXT,
ADD COLUMN IF NOT EXISTS form_data JSONB;

-- Add comment to document the purpose
COMMENT ON COLUMN public.invitation_letters.file_name IS 'Generated PDF filename for the invitation letter';
COMMENT ON COLUMN public.invitation_letters.form_data IS 'Complete form data stored as JSON for reference';

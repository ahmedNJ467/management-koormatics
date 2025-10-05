-- Remove unwanted columns from invitation_letters table
-- Run this in Supabase SQL Editor

-- Remove the visit_date column if it exists
ALTER TABLE public.invitation_letters 
DROP COLUMN IF EXISTS visit_date;

-- Remove the duration_of_stay column if it exists
ALTER TABLE public.invitation_letters 
DROP COLUMN IF EXISTS duration_of_stay;

-- Verify the final table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'invitation_letters' 
AND table_schema = 'public'
ORDER BY ordinal_position;

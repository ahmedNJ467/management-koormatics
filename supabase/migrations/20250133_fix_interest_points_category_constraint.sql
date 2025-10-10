-- Fix interest_points category constraint to match TypeScript types
-- Drop the existing CHECK constraint
ALTER TABLE public.interest_points DROP CONSTRAINT IF EXISTS interest_points_category_check;

-- Add new CHECK constraint with the correct categories
ALTER TABLE public.interest_points ADD CONSTRAINT interest_points_category_check 
    CHECK (category IN ('places', 'checkpoints', 'market', 'security', 'fuel', 'health', 'restaurant', 'hotel', 'bank', 'school', 'mosque', 'general'));

-- Add missing columns that the TypeScript types expect
ALTER TABLE public.interest_points ADD COLUMN IF NOT EXISTS icon_url TEXT;
ALTER TABLE public.interest_points ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';

-- Fix clients table - add missing documents column
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

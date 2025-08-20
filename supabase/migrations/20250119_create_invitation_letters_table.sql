-- Create invitation_letters table
CREATE TABLE public.invitation_letters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Reference information
  ref_number TEXT NOT NULL,
  letter_date DATE NOT NULL,
  
  -- Company information
  company_name TEXT NOT NULL DEFAULT 'Peace Business Group',
  company_address TEXT NOT NULL DEFAULT 'Airport Road, Wadajir District, Mogadishu, Somalia',
  company_email TEXT NOT NULL DEFAULT 'reservations@peacebusinessgroup.com',
  company_phone TEXT NOT NULL DEFAULT '+252 61-94-94973 / +252 61-94-94974',
  
  -- Visitor information
  visitor_name TEXT NOT NULL,
  visitor_nationality TEXT NOT NULL,
  visitor_organization TEXT NOT NULL,
  visitor_passport TEXT NOT NULL,
  passport_expiry DATE NOT NULL,
  
  -- Visit details
  purpose_of_visit TEXT NOT NULL,
  duration_of_stay TEXT NOT NULL,
  date_of_visit DATE NOT NULL,
  
  -- File information
  file_name TEXT NOT NULL,
  pdf_url TEXT, -- Optional: for storing PDF in Supabase Storage
  
  -- Metadata
  generated_by UUID REFERENCES auth.users(id),
  form_data JSONB NOT NULL -- Store complete form data as backup
);

-- Add indexes for better performance
CREATE INDEX invitation_letters_created_at_idx ON public.invitation_letters(created_at DESC);
CREATE INDEX invitation_letters_ref_number_idx ON public.invitation_letters(ref_number);
CREATE INDEX invitation_letters_visitor_name_idx ON public.invitation_letters(visitor_name);
CREATE INDEX invitation_letters_generated_by_idx ON public.invitation_letters(generated_by);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invitation_letters_updated_at
    BEFORE UPDATE ON public.invitation_letters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for invitation letter PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('invitation-letters', 'invitation-letters', false)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies
ALTER TABLE public.invitation_letters ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to view their own letters
CREATE POLICY "Users can view their own invitation letters" 
ON public.invitation_letters 
FOR SELECT 
TO authenticated 
USING (generated_by = auth.uid());

-- Policy for authenticated users to insert their own letters
CREATE POLICY "Users can create invitation letters" 
ON public.invitation_letters 
FOR INSERT 
TO authenticated 
WITH CHECK (generated_by = auth.uid());

-- Policy for authenticated users to update their own letters
CREATE POLICY "Users can update their own invitation letters" 
ON public.invitation_letters 
FOR UPDATE 
TO authenticated 
USING (generated_by = auth.uid())
WITH CHECK (generated_by = auth.uid());

-- Policy for authenticated users to delete their own letters
CREATE POLICY "Users can delete their own invitation letters" 
ON public.invitation_letters 
FOR DELETE 
TO authenticated 
USING (generated_by = auth.uid());

-- Storage policies for invitation letter PDFs
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

-- Add comments for documentation
COMMENT ON TABLE public.invitation_letters IS 'Stores invitation letter data with form information and metadata';
COMMENT ON COLUMN public.invitation_letters.form_data IS 'Complete form data stored as JSONB for backwards compatibility and migration';
COMMENT ON COLUMN public.invitation_letters.pdf_url IS 'Optional URL to PDF stored in Supabase Storage bucket'; 
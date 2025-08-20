-- Fix security issue: Remove view that exposes auth.users and create secure alternative

-- First, drop the problematic view that exposes auth.users
DROP VIEW IF EXISTS public.vw_user_roles;

-- Create a profiles table to store user information securely
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create a secure view that doesn't expose auth.users
CREATE OR REPLACE VIEW public.vw_user_roles AS
SELECT 
  p.id AS user_id,
  p.created_at,
  p.email,
  p.full_name,
  COALESCE(array_agg(ur.role_slug) FILTER (WHERE ur.role_slug IS NOT NULL), '{}'::text[]) AS roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.created_at, p.email, p.full_name;

-- Create a secure function to get user pages without exposing auth.users
CREATE OR REPLACE VIEW public.vw_user_pages AS
SELECT 
  p.id AS user_id,
  COALESCE(array_agg(DISTINCT rpa.page_id) FILTER (WHERE rpa.page_id IS NOT NULL), '{}'::text[]) AS pages
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.role_page_access rpa ON rpa.role_slug = ur.role_slug
GROUP BY p.id;

-- Create a trigger function to automatically create/update profiles when users sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = NEW.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically handle user profile creation/updates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Migrate existing data from auth.users to profiles (if any)
INSERT INTO public.profiles (id, email, full_name, created_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', ''),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;
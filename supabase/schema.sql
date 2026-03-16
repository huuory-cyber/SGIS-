-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'provider', 'agent')),
  station_id TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  approval_status TEXT DEFAULT 'pending_approval' CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Stations table
CREATE TABLE IF NOT EXISTS public.stations (
  id TEXT PRIMARY KEY DEFAULT 'ST-' || substr(encode(gen_random_bytes(16), 'hex'), 1, 8),
  name TEXT NOT NULL,
  address TEXT,
  neighborhood TEXT NOT NULL,
  locality TEXT NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Agents table
CREATE TABLE IF NOT EXISTS public.agents (
  id TEXT PRIMARY KEY DEFAULT 'AG-' || substr(encode(gen_random_bytes(16), 'hex'), 1, 8),
  name TEXT NOT NULL,
  badge_number TEXT NOT NULL UNIQUE,
  station_id TEXT NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Social Records table (enhanced version)
CREATE TABLE IF NOT EXISTS public.social_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Information (Encrypted)
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT CHECK (gender IN ('Masculino', 'Feminino', 'Outro', 'Prefiro não dizer')),
  phone TEXT,
  email TEXT,
  
  -- Location
  neighborhood TEXT NOT NULL,
  locality TEXT NOT NULL,
  address TEXT,
  
  -- Family & Social Context
  family_size INTEGER,
  dependents INTEGER,
  education_level TEXT CHECK (education_level IN ('Sem escolaridade', 'Ensino Fundamental', 'Ensino Médio', 'Ensino Superior', 'Pós-graduação')),
  monthly_income DECIMAL(10, 2),
  
  -- Disability & Health
  has_disability BOOLEAN NOT NULL DEFAULT FALSE,
  disability_type TEXT CHECK (disability_type IN ('Física', 'Visual', 'Auditiva', 'Intelectual', 'Múltipla', 'Outra')),
  health_condition TEXT,
  situation TEXT NOT NULL CHECK (situation IN ('Crítica', 'Moderada', 'Estável')),
  social_history TEXT,
  
  -- Employment & Action
  employment_status TEXT NOT NULL CHECK (employment_status IN ('Empregado', 'Desempregado', 'Autônomo', 'Aposentado', 'Estudante')),
  help_needed TEXT NOT NULL,
  referral TEXT NOT NULL,
  
  -- Image Storage
  image_urls TEXT[] DEFAULT '{}',
  image_count INTEGER DEFAULT 0,
  
  -- Admin fields
  admin_notes TEXT,
  
  -- System fields
  agent_id TEXT,
  station_id TEXT,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Offline sync
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('pending', 'synced', 'conflict')),
  offline_created BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Storage bucket for social record images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('social-records-images', 'social-records-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Providers can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can do everything" ON storage.objects;

-- Allow authenticated users to view images
CREATE POLICY "Authenticated users can view images"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'social-records-images');

-- Allow admins to upload any images
CREATE POLICY "Admins can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-records-images' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow approved providers to upload images
CREATE POLICY "Approved providers can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-records-images' AND
  (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
);

-- Allow admins to delete any images
CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-records-images' AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- Allow providers to delete their own images
CREATE POLICY "Providers can delete their images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-records-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_records_provider ON public.social_records(provider_id);
CREATE INDEX IF NOT EXISTS idx_social_records_station ON public.social_records(station_id);
CREATE INDEX IF NOT EXISTS idx_social_records_agent ON public.social_records(agent_id);
CREATE INDEX IF NOT EXISTS idx_social_records_created_at ON public.social_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_records_situation ON public.social_records(situation);
CREATE INDEX IF NOT EXISTS idx_social_records_neighborhood ON public.social_records(neighborhood);

CREATE INDEX IF NOT EXISTS idx_stations_provider ON public.stations(provider_id);
CREATE INDEX IF NOT EXISTS idx_agents_provider ON public.agents(provider_id);
CREATE INDEX IF NOT EXISTS idx_agents_station ON public.agents(station_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_records_updated_at
  BEFORE UPDATE ON public.social_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_records ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Admins can approve providers"
  ON public.profiles FOR UPDATE
  USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Stations policies
CREATE POLICY "Approved providers can view their own stations"
  ON public.stations FOR SELECT
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Approved providers can insert their own stations"
  ON public.stations FOR INSERT
  WITH CHECK (
    provider_id = auth.uid() AND
    (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
  );

CREATE POLICY "Approved providers can update their own stations"
  ON public.stations FOR UPDATE
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Agents policies
CREATE POLICY "Approved providers can view their agents"
  ON public.agents FOR SELECT
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Approved providers can insert their agents"
  ON public.agents FOR INSERT
  WITH CHECK (
    provider_id = auth.uid() AND
    (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
  );

CREATE POLICY "Approved providers can update their agents"
  ON public.agents FOR UPDATE
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Social Records policies
CREATE POLICY "Approved providers can view their own records"
  ON public.social_records FOR SELECT
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Approved providers can insert their own records"
  ON public.social_records FOR INSERT
  WITH CHECK (
    provider_id = auth.uid() AND
    (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved'
  );

CREATE POLICY "Approved providers can update their own records"
  ON public.social_records FOR UPDATE
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Approved providers can delete their own records"
  ON public.social_records FOR DELETE
  USING (
    (provider_id = auth.uid() AND
     (SELECT approval_status FROM public.profiles WHERE id = auth.uid()) = 'approved') OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, is_active, approval_status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'provider'),
    FALSE,
    'pending_approval'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create initial admin user (you need to set this in Supabase dashboard)
-- This is a placeholder - the actual admin should be created through the Supabase dashboard
-- with the role 'admin' and is_active set to TRUE

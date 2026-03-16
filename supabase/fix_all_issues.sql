-- COMBINED FIX - Execute this in Supabase SQL Editor
-- This script fixes both the Storage RLS issue and adds the admin_notes column

-- =====================================================
-- PART 1: Fix Storage RLS Policies
-- =====================================================

-- Make bucket public (so images can be viewed)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'social-records-images';

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view images" ON storage.objects;
DROP POLICY IF EXISTS "Providers can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Providers can delete their images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Approved providers can upload images" ON storage.objects;

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

-- =====================================================
-- PART 2: Add admin_notes column and make fields nullable
-- =====================================================

-- Add admin_notes column
ALTER TABLE public.social_records
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Make agent_id and station_id nullable (for admin records)
ALTER TABLE public.social_records
ALTER COLUMN agent_id DROP NOT NULL;

ALTER TABLE public.social_records
ALTER COLUMN station_id DROP NOT NULL;

-- Drop and recreate foreign key constraints to allow NULL values
ALTER TABLE public.social_records
DROP CONSTRAINT IF EXISTS social_records_agent_id_fkey;

ALTER TABLE public.social_records
DROP CONSTRAINT IF EXISTS social_records_station_id_fkey;

-- Recreate foreign key constraints with ON DELETE SET NULL and allowing NULL
ALTER TABLE public.social_records
ADD CONSTRAINT social_records_agent_id_fkey
FOREIGN KEY (agent_id)
REFERENCES public.agents(id)
ON DELETE SET NULL;

ALTER TABLE public.social_records
ADD CONSTRAINT social_records_station_id_fkey
FOREIGN KEY (station_id)
REFERENCES public.stations(id)
ON DELETE SET NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify storage policies
SELECT 
  'Storage Policies' as section,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
ORDER BY policyname;

-- Verify table columns
SELECT 
  'Table Columns' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'social_records' 
  AND table_schema = 'public'
  AND column_name IN ('admin_notes', 'agent_id', 'station_id')
ORDER BY column_name;

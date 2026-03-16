-- Fix Storage RLS Policies for Social Records Images
-- Execute this in the Supabase SQL Editor

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

-- Verify policies
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
WHERE tablename = 'objects' 
  AND schemaname = 'storage';

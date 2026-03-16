-- Add admin_notes column to social_records table
-- Execute this in the Supabase SQL Editor

-- Add admin_notes column
ALTER TABLE public.social_records 
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Make agent_id and station_id nullable (for admin records)
ALTER TABLE public.social_records 
ALTER COLUMN agent_id DROP NOT NULL;

ALTER TABLE public.social_records 
ALTER COLUMN station_id DROP NOT NULL;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'social_records' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

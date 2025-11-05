-- Quick fix: Add employment_details column if it doesn't exist properly
-- Run this in Supabase SQL Editor

-- First, let's see the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'staff_details'
ORDER BY ordinal_position;

-- If employment_details doesn't exist or isn't JSONB, this will add/fix it
ALTER TABLE public.staff_details 
ADD COLUMN IF NOT EXISTS employment_details JSONB DEFAULT '{}';

-- If it exists but wrong type, this will change it (uncomment if needed)
-- ALTER TABLE public.staff_details ALTER COLUMN employment_details TYPE JSONB USING employment_details::JSONB;

-- Verify the fix
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'staff_details'
AND column_name = 'employment_details';
-- Alternative 1: Simple separate columns approach (like members)
-- Run this in Supabase SQL Editor if you want individual columns

-- Add individual columns instead of JSONB
ALTER TABLE public.staff_details 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS join_date DATE,
ADD COLUMN IF NOT EXISTS salary NUMERIC,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- Drop employment_details if it's causing issues
-- ALTER TABLE public.staff_details DROP COLUMN IF EXISTS employment_details;

-- Verify structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'staff_details'
ORDER BY ordinal_position;
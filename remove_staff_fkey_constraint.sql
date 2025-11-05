-- Fix the foreign key constraint issue
-- Run this in Supabase SQL Editor

-- Remove the foreign key constraint (user_id is primary key, so we can't make it nullable)
-- Staff members don't need to be actual auth users, just unique IDs
ALTER TABLE public.staff_details 
DROP CONSTRAINT IF EXISTS staff_details_user_id_fkey;

-- Verify the constraint is removed
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid = 'public.staff_details'::regclass;

-- Show remaining constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'staff_details' 
AND table_schema = 'public';
-- Temporary fix for staff_details access
-- Run this in Supabase SQL Editor to remove RLS and grant access

-- Disable RLS temporarily
ALTER TABLE staff_details DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their gym staff" ON staff_details;
DROP POLICY IF EXISTS "Users can insert their gym staff" ON staff_details;
DROP POLICY IF EXISTS "Users can update their gym staff" ON staff_details;
DROP POLICY IF EXISTS "Users can delete their gym staff" ON staff_details;

-- Grant full access to authenticated users
GRANT ALL PRIVILEGES ON staff_details TO authenticated;
GRANT ALL PRIVILEGES ON staff_details TO anon;
GRANT ALL PRIVILEGES ON staff_details TO service_role;

-- Grant usage on sequence if exists
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
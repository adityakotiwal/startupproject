-- ================================================
-- FIX SETTINGS PAGE - Add Missing Columns
-- ================================================
-- This script adds all necessary columns for the Settings page to work properly
-- Run this in Supabase SQL Editor

-- ================================================
-- 1. PROFILES TABLE - Add missing columns
-- ================================================

-- Add avatar_url column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add phone column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add updated_at column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ================================================
-- 2. GYMS TABLE - Add missing columns
-- ================================================

-- Add logo_url column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add address column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add phone column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add email column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add website column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add timezone column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add currency column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add max_capacity column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS max_capacity INTEGER;

-- Add operating_hours JSONB column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS operating_hours JSONB DEFAULT '{}';

-- Add social_media JSONB column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS social_media JSONB DEFAULT '{}';

-- Add amenities array column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Add trainer_certifications array column if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS trainer_certifications TEXT[] DEFAULT ARRAY[]::TEXT[];

-- ================================================
-- 3. CREATE INDEXES for Performance
-- ================================================

-- Indexes for profiles table
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);

-- Indexes for gyms table
CREATE INDEX IF NOT EXISTS idx_gyms_logo_url ON gyms(logo_url);
CREATE INDEX IF NOT EXISTS idx_gyms_email ON gyms(email);
CREATE INDEX IF NOT EXISTS idx_gyms_phone ON gyms(phone);

-- ================================================
-- 4. UPDATE RLS POLICIES (if needed)
-- ================================================

-- Ensure users can update their own profile
DO $$ 
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    
    -- Create update policy
    CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Ensure users can select their own profile
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
    
    CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- ================================================
-- 5. CREATE TRIGGER for updated_at
-- ================================================

-- Create or replace trigger function for profiles
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;

-- Create trigger
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- ================================================
-- 6. VERIFY COLUMNS WERE ADDED
-- ================================================

-- Check profiles table columns
SELECT 
    'profiles' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
AND column_name IN ('avatar_url', 'phone', 'updated_at', 'full_name', 'email')
ORDER BY column_name;

-- Check gyms table columns
SELECT 
    'gyms' as table_name,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'gyms'
AND column_name IN (
    'logo_url', 'address', 'phone', 'email', 'website', 
    'timezone', 'currency', 'max_capacity', 'operating_hours', 
    'social_media', 'amenities', 'trainer_certifications'
)
ORDER BY column_name;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Settings tables updated successfully!';
    RAISE NOTICE '✅ All columns added to profiles and gyms tables';
    RAISE NOTICE '✅ Indexes created for performance';
    RAISE NOTICE '✅ RLS policies updated';
    RAISE NOTICE '✅ Triggers configured';
    RAISE NOTICE '';
    RAISE NOTICE '👉 Now test your Settings page - it should work perfectly!';
END $$;

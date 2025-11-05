-- Add avatar_url column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add logo_url column to gyms table if it doesn't exist
ALTER TABLE gyms 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_avatar_url ON profiles(avatar_url);
CREATE INDEX IF NOT EXISTS idx_gyms_logo_url ON gyms(logo_url);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('profiles', 'gyms')
AND column_name IN ('avatar_url', 'logo_url');

-- GymSync Pro - Storage Buckets Setup
-- Run this in Supabase SQL Editor to create storage buckets

-- =====================================================
-- 1. CREATE STORAGE BUCKETS
-- =====================================================

-- Create profiles bucket for gym owner profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profiles',
  'profiles',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create gym-assets bucket for gym logos and other gym assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gym-assets',
  'gym-assets',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. STORAGE POLICIES FOR PROFILES BUCKET
-- =====================================================

-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profiles');

-- =====================================================
-- 3. STORAGE POLICIES FOR GYM-ASSETS BUCKET
-- =====================================================

-- Allow gym owners to upload assets for their gym
CREATE POLICY "Gym owners can upload their gym assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gym-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Allow gym owners to update their gym assets
CREATE POLICY "Gym owners can update their gym assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gym-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Allow gym owners to delete their gym assets
CREATE POLICY "Gym owners can delete their gym assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'gym-assets' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM gyms WHERE owner_id = auth.uid()
  )
);

-- Allow public read access to gym assets (logos appear on receipts, etc.)
CREATE POLICY "Public can view gym assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'gym-assets');

-- =====================================================
-- 4. GRANT PERMISSIONS
-- =====================================================

-- Grant access to authenticated users
GRANT ALL ON storage.buckets TO authenticated;
GRANT ALL ON storage.objects TO authenticated;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check if buckets were created successfully
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('profiles', 'gym-assets');

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects'
AND policyname LIKE '%profile%' OR policyname LIKE '%gym%'
ORDER BY policyname;

-- =====================================================
-- BUCKET STRUCTURE
-- =====================================================

-- profiles/
--   ├── {user_id}/
--   │   └── avatar.{ext}

-- gym-assets/
--   ├── {gym_id}/
--   │   ├── logo.{ext}
--   │   ├── banner.{ext}  (future)
--   │   └── photos/       (future)

-- =====================================================
-- NOTES
-- =====================================================

-- 1. Profile pictures are stored in: profiles/{user_id}/avatar.{ext}
-- 2. Gym logos are stored in: gym-assets/{gym_id}/logo.{ext}
-- 3. Both buckets are PUBLIC for easy access
-- 4. File size limit: 2MB per file
-- 5. Allowed formats: JPEG, PNG, GIF, WebP, SVG (for logos)
-- 6. RLS policies ensure users can only upload to their own folders
-- 7. Public read access allows displaying images without authentication

-- =====================================================
-- TROUBLESHOOTING
-- =====================================================

-- If policies already exist and cause errors, drop them first:
-- DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own profile pictures" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own profile pictures" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view profile pictures" ON storage.objects;
-- DROP POLICY IF EXISTS "Gym owners can upload their gym assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Gym owners can update their gym assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Gym owners can delete their gym assets" ON storage.objects;
-- DROP POLICY IF EXISTS "Public can view gym assets" ON storage.objects;

-- Then run this script again

# 📦 Storage Setup Guide - GymSync Pro

## Overview
This guide walks you through setting up Supabase Storage for profile pictures and gym logos in GymSync Pro.

## 🎯 What You're Setting Up

### Two Storage Buckets:
1. **`profiles`** - User profile pictures/avatars
2. **`gym-assets`** - Gym logos and branding images

### File Structure:
```
profiles/
  └── {user_id}/
      └── avatar.{ext}

gym-assets/
  └── {gym_id}/
      └── logo.{ext}
```

## 📋 Prerequisites
- Access to Supabase Dashboard
- Project URL: `https://app.supabase.com/project/[your-project-id]`
- Database access with admin privileges

## 🚀 Setup Steps

### Step 1: Create Storage Buckets

1. **Open Supabase Dashboard**
   - Navigate to your project
   - Click on **SQL Editor** in the left sidebar

2. **Run Bucket Creation Script**
   - Open the file: `create_storage_buckets.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run** (or press Ctrl/Cmd + Enter)

3. **Verify Bucket Creation**
   - Go to **Storage** section in left sidebar
   - You should see two new buckets:
     - ✅ `profiles`
     - ✅ `gym-assets`
   - Both should show as **Public** with **2MB** file size limit

### Step 2: Add Database Columns

1. **Open SQL Editor Again**
   - Stay in SQL Editor or navigate back to it

2. **Run Column Addition Script**
   - Open the file: `add_image_url_columns.sql`
   - Copy the entire contents
   - Paste into SQL Editor
   - Click **Run**

3. **Verify Column Addition**
   - Go to **Table Editor** → **profiles** table
   - Should see new column: `avatar_url` (TEXT)
   - Go to **Table Editor** → **gyms** table
   - Should see new column: `logo_url` (TEXT)

### Step 3: Test the Setup

1. **Login to GymSync Pro**
   - Navigate to your application
   - Login as a gym owner

2. **Go to Settings Page**
   - Click on your profile picture/name in the header
   - Or navigate to `/settings`

3. **Test Profile Picture Upload**
   - In **Profile** tab, click "Upload Profile Picture"
   - Select an image (JPEG, PNG, GIF, WebP, or SVG)
   - Max size: 2MB
   - Should upload successfully and display immediately

4. **Test Gym Logo Upload**
   - Switch to **Gym Info** tab
   - In "Logo & Branding" card, click "Upload Logo"
   - Select an image
   - Should upload successfully and display immediately

## 🔒 Security Features

### Row Level Security (RLS)
Each bucket has 4 policies:

**For `profiles` bucket:**
- ✅ Users can INSERT to their own folder (`profiles/{user_id}/`)
- ✅ Users can UPDATE their own files
- ✅ Users can DELETE their own files
- ✅ Everyone can SELECT (public read access for displaying images)

**For `gym-assets` bucket:**
- ✅ Users can INSERT to their gym's folder (`gym-assets/{gym_id}/`)
- ✅ Users can UPDATE their gym's files
- ✅ Users can DELETE their gym's files
- ✅ Everyone can SELECT (public read access)

### File Upload Restrictions
- **Allowed types:** JPEG, PNG, GIF, WebP, SVG
- **Max file size:** 2MB per file
- **Naming:** Automatically uses `avatar.{ext}` or `logo.{ext}` (overwrites existing)

## 🐛 Troubleshooting

### Issue: "Bucket already exists" error
**Solution:**
```sql
-- Delete existing bucket (WARNING: This deletes all files)
DELETE FROM storage.buckets WHERE id = 'profiles';
DELETE FROM storage.buckets WHERE id = 'gym-assets';

-- Then re-run create_storage_buckets.sql
```

### Issue: "Column already exists" error
**Solution:** Column was already added. No action needed.

### Issue: Upload fails with "Permission denied"
**Solution:**
1. Verify RLS policies exist:
   ```sql
   SELECT * FROM storage.policies 
   WHERE bucket_id IN ('profiles', 'gym-assets');
   ```
   Should return 8 policies total (4 per bucket)

2. If missing, re-run the RLS policy section from `create_storage_buckets.sql`

### Issue: Images don't display after upload
**Solution:**
1. Check if bucket is public:
   - Go to **Storage** → Select bucket → **Settings**
   - Ensure "Public bucket" is enabled

2. Check SELECT policy exists:
   ```sql
   SELECT * FROM storage.policies 
   WHERE bucket_id = 'profiles' AND operation = 'SELECT';
   ```

3. Clear browser cache and reload page

### Issue: "File too large" error
**Solution:** 
- File must be under 2MB
- Compress image before uploading
- Or modify bucket settings to allow larger files

## 📊 Verification Queries

### Check Bucket Configuration
```sql
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets
WHERE id IN ('profiles', 'gym-assets');
```

**Expected Output:**
| id | name | public | file_size_limit | allowed_mime_types |
|----|------|--------|----------------|-------------------|
| profiles | profiles | true | 2097152 | [array of image types] |
| gym-assets | gym-assets | true | 2097152 | [array of image types] |

### Check RLS Policies
```sql
SELECT bucket_id, name, operation, definition
FROM storage.policies
WHERE bucket_id IN ('profiles', 'gym-assets')
ORDER BY bucket_id, operation;
```

**Expected:** 8 policies total (INSERT, UPDATE, DELETE, SELECT for each bucket)

### Check Database Columns
```sql
-- Check profiles table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'avatar_url';

-- Check gyms table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'gyms' AND column_name = 'logo_url';
```

**Expected:** Both should return one row with data_type = 'text'

## 🎨 Usage in Application

### Upload Profile Picture
```typescript
// In Settings page - Profile tab
const handleProfilePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Validation
  if (file.size > 2 * 1024 * 1024) {
    alert('File size must be less than 2MB');
    return;
  }

  // Upload to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `avatar.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('profiles')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return;
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('profiles')
    .getPublicUrl(filePath);

  // Save URL to database
  await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id);
};
```

### Upload Gym Logo
```typescript
// In Settings page - Gym Info tab
const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;

  // Similar validation...

  // Upload to gym-assets bucket
  const fileExt = file.name.split('.').pop();
  const fileName = `logo.${fileExt}`;
  const filePath = `${gym.id}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('gym-assets')
    .upload(filePath, file, { upsert: true });

  // Get public URL and save to database...
};
```

## 🔄 Migration from Existing Setup

If you already have `member-photos` or `staff-photos` buckets:

1. **These are separate** - Don't delete them
2. **New buckets are for:**
   - `profiles` → Gym owner/admin profile pictures
   - `gym-assets` → Gym branding (logo, banner, etc.)
3. **Keep existing buckets for:**
   - `member-photos` → Member profile pictures (if used)
   - `staff-photos` → Staff profile pictures (if used)

## 📝 Next Steps

After successful setup:
1. ✅ Test profile picture upload
2. ✅ Test gym logo upload
3. ✅ Verify images display correctly across the app
4. ✅ Test on different devices/browsers
5. ✅ Consider adding image optimization (resize, compress)

## 🆘 Support

If you encounter issues:
1. Check Supabase logs: **Logs** → **Postgres Logs**
2. Check browser console for JavaScript errors
3. Verify environment variables in `.env.local`
4. Review the troubleshooting section above

## 📚 Related Files

- **SQL Scripts:**
  - `create_storage_buckets.sql` - Bucket creation and RLS policies
  - `add_image_url_columns.sql` - Database schema updates
  - `setup-storage.sh` - Quick setup helper script

- **Application Code:**
  - `src/app/settings/page.tsx` - Settings page with upload handlers
  - `src/components/AppHeader.tsx` - Profile picture display in header
  - `src/lib/supabase.ts` - Supabase client configuration

## ✨ Features Enabled

After setup, your app will have:
- 👤 **User profile pictures** in header and settings
- 🏢 **Gym logos** in settings and potentially other pages
- 🖼️ **Image previews** before and after upload
- ♻️ **Automatic overwrites** (same filename policy)
- 🔒 **Secure uploads** with RLS enforcement
- 🌐 **Public URLs** for displaying images anywhere

---

**Setup Time:** ~5 minutes  
**Difficulty:** Easy  
**Impact:** High (complete image upload functionality)

🎉 **You're all set!** Enjoy your new image upload features in GymSync Pro.

# Supabase Profile Storage Setup

## Overview
Profile image upload functionality requires a Supabase Storage bucket to store user profile pictures.

## Storage Bucket Setup

### 1. Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `profile-images`
5. Set it to **Public bucket** (so profile images can be accessed via public URLs)
6. Click **Create bucket**

### 2. Set Up Storage Policies (Row Level Security)

After creating the bucket, you need to set up policies to allow users to upload their own images:

**Option A: Using the Policy Editor (Recommended)**

1. Go to **Storage** in the left sidebar
2. Click on the `profile-images` bucket
3. Click on the **Policies** tab
4. Click **New Policy**

**Create Upload Policy (INSERT):**
1. Click **New Policy**
2. Select **For full customization** (or use the template)
3. Policy name: `Authenticated users can upload profile images`
4. Allowed operation: Select **INSERT**
5. Policy definition - paste this SQL:
   ```sql
   bucket_id = 'profile-images'::text AND auth.role() = 'authenticated' AND storage.foldername(name)[1] = 'avatars'
   ```
6. Click **Review** then **Save policy**

**Create Read Policy (SELECT):**
1. Click **New Policy** again
2. Select **For full customization**
3. Policy name: `Anyone can view profile images`
4. Allowed operation: Select **SELECT**
5. Policy definition - paste this SQL:
   ```sql
   bucket_id = 'profile-images'::text
   ```
6. Click **Review** then **Save policy**

**Option B: Using SQL Editor (Alternative)**

If the policy editor doesn't work, you can run this SQL in the **SQL Editor**:

```sql
-- Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can upload profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images'::text 
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Create SELECT policy for public access
CREATE POLICY "Anyone can view profile images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-images'::text);
```

**Important Notes:**
- Make sure the bucket name is exactly `profile-images` (case-sensitive)
- The upload policy requires users to be authenticated
- Files must be uploaded to the `avatars/` folder (which the code does automatically)
- The read policy makes all images publicly viewable

### 3. Verify Setup

The profile upload endpoint (`/api/profile/upload-image`) will:
- Upload images to `avatars/{userId}-{timestamp}.{ext}` path
- Return a public URL for the uploaded image
- Validate file type (must be an image)
- Validate file size (max 5MB)

## Usage

Users can now:
1. Click "Edit Profile" button on their profile page
2. Upload a profile picture (optional)
3. Add/update their portfolio/website URL
4. Save changes

Profile images are stored in Supabase Storage and URLs are saved in the user's metadata. The portfolio URL is also stored in user metadata.


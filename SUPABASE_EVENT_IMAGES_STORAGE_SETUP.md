# Supabase Event Images Storage Setup

## Overview
Post image upload functionality requires a Supabase Storage bucket to store user post images.

## Storage Bucket Setup

### 1. Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `event-images`
5. Set it to **Public bucket** (so images can be accessed via public URLs)
6. Click **Create bucket**

### 2. Set Up Storage Policies (Row Level Security)

After creating the bucket, you need to set up policies to allow users to upload images to the `posts/` folder.

**Option A: Using the Policy Editor (Recommended)**

1. Go to **Storage** in the left sidebar
2. Click on the `event-images` bucket
3. Click on the **Policies** tab
4. Click **New Policy**

**Create Upload Policy (INSERT):**
1. Click **New Policy**
2. Select **For full customization** (or use the template)
3. Policy name: `Authenticated users can upload post images`
4. Allowed operation: Select **INSERT**
5. Policy definition - paste this SQL:
   ```sql
   bucket_id = 'event-images'::text AND auth.role() = 'authenticated' AND (storage.foldername(name))[1] = 'posts'
   ```
6. Click **Review** then **Save policy**

**Create Read Policy (SELECT):**
1. Click **New Policy** again
2. Select **For full customization**
3. Policy name: `Anyone can view event images`
4. Allowed operation: Select **SELECT**
5. Policy definition - paste this SQL:
   ```sql
   bucket_id = 'event-images'::text
   ```
6. Click **Review** then **Save policy**

**Option B: Using SQL Editor (Alternative)**

Run the SQL from `supabase-migrations/setup_event_images_storage_policies.sql` in the SQL Editor:

```sql
-- Storage policies for event-images bucket
-- This allows authenticated users to upload images to the posts/ folder
-- and allows public read access to all images

-- Create INSERT policy for authenticated users to upload to posts/ folder
CREATE POLICY IF NOT EXISTS "Authenticated users can upload post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'posts'
);

-- Create SELECT policy for public read access
CREATE POLICY IF NOT EXISTS "Anyone can view event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images'::text);

-- Create DELETE policy for users to delete their own images
-- Files are named like: posts/{user_id}-{timestamp}.jpg
CREATE POLICY IF NOT EXISTS "Users can delete their own post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'posts'
  AND name LIKE ('posts/' || auth.uid()::text || '-%')
);
```

**Important Notes:**
- Make sure the bucket name is exactly `event-images` (case-sensitive)
- The upload policy requires users to be authenticated
- Files must be uploaded to the `posts/` folder (which the code does automatically)
- The read policy makes all images publicly viewable
- Users can only delete their own images (files starting with their user ID)

### 3. Verify Setup

The post upload functionality will:
- Upload images to `posts/{userId}-{timestamp}.jpg` path
- Automatically resize images (max 1200px width, ~1MB target size)
- Return a public URL for the uploaded image
- Validate file type (must be JPEG, PNG, WebP, or GIF)

## Usage

Users can now:
1. Click the Media icon (📷) in the post composer on the Community page
2. Select an image file
3. The image will be automatically resized and uploaded
4. A preview will appear before posting
5. Post the image along with optional text


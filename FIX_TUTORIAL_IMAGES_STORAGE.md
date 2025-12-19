# Fix Tutorial Images Storage Policies

## Issue
Tutorial images need to be uploaded to Supabase Storage, but the storage policies don't yet allow uploads to the `tutorials/` folder.

## Solution
Add storage policies to allow authenticated users to upload and delete tutorial images.

## Steps

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase-migrations/add_tutorial_images_storage_policies.sql`
5. Click **Run**

## What This Does

- Creates an INSERT policy that allows authenticated users to upload images to the `tutorials/` folder in the `event-images` bucket
- Creates a DELETE policy that allows users to delete their own tutorial images (files that start with their user_id)
- The public SELECT policy already exists (from the main storage setup), so images will be publicly viewable

## Verification

After running the migration, you should be able to:
- Upload images in the tutorial form
- See uploaded images as thumbnails
- Insert images into tutorial content
- Delete uploaded images before posting

# Fix Open Calls Header Image Upload

## Issue
Getting "new row violates row-level security policy" error when uploading header images for open calls.

## Solution
The storage policy for `event-images` bucket needs to allow uploads to the `open-calls/` folder.

## Run This SQL in Supabase

Copy and paste this SQL into your Supabase SQL Editor:

```sql
-- Add INSERT policy for open-calls folder
CREATE POLICY "Authenticated users can upload open call images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'open-calls'
);

-- Add DELETE policy for open-calls folder
CREATE POLICY "Users can delete their own open call images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'open-calls'
  AND name LIKE ('open-calls/' || auth.uid()::text || '-%')
);
```

## Steps

1. Go to Supabase Dashboard → SQL Editor
2. Click **New Query**
3. Paste the SQL above
4. Click **Run**
5. Try uploading a header image again

## What This Does

- Allows authenticated users to upload images to the `open-calls/` folder
- Allows users to delete their own open call images (files starting with their user ID)
- Works alongside the existing `posts/` folder policies

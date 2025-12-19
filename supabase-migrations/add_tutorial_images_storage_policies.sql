-- Add storage policies for tutorial images in event-images bucket
-- This allows authenticated users to upload and delete tutorial images

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Authenticated users can upload tutorial images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own tutorial images" ON storage.objects;

-- Create INSERT policy for authenticated users to upload to tutorials/ folder
CREATE POLICY "Authenticated users can upload tutorial images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'tutorials'
);

-- Create DELETE policy for users to delete their own tutorial images
-- Files are named like: tutorials/{user_id}-{timestamp}-{random}.jpg
CREATE POLICY "Users can delete their own tutorial images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'tutorials'
  AND name LIKE ('tutorials/' || auth.uid()::text || '-%')
);

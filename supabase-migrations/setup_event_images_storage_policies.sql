-- Storage policies for event-images bucket
-- This allows authenticated users to upload images to the posts/ folder
-- and allows public read access to all images

-- Drop existing policies if they exist (to allow re-running this migration)
DROP POLICY IF EXISTS "Authenticated users can upload post images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;

-- Create INSERT policy for authenticated users to upload to posts/ folder
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'posts'
);

-- Create SELECT policy for public read access
CREATE POLICY "Anyone can view event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images'::text);

-- Create DELETE policy for users to delete their own images
-- Files are named like: posts/{user_id}-{timestamp}.jpg
CREATE POLICY "Users can delete their own post images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'::text 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'posts'
  AND name LIKE ('posts/' || auth.uid()::text || '-%')
);


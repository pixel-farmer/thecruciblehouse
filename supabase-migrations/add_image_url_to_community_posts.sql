-- Add image_url column to community_posts table for post images
ALTER TABLE community_posts 
ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN community_posts.image_url IS 'Optional image URL for posts with images';


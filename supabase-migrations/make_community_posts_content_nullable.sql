-- Make content column nullable in community_posts table
-- This allows posts to have only images without text content

ALTER TABLE community_posts 
ALTER COLUMN content DROP NOT NULL;

COMMENT ON COLUMN community_posts.content IS 'Post text content (nullable - posts can have only images)';


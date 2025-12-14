-- Add group_id column to community_posts table
-- This allows posts to be associated with specific groups
-- NULL group_id means it's a general community post

ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE CASCADE;

-- Create index for better query performance when filtering by group
CREATE INDEX IF NOT EXISTS idx_community_posts_group_id ON community_posts(group_id);

-- Add comment
COMMENT ON COLUMN community_posts.group_id IS 'Optional group ID. NULL means it is a general community post.';


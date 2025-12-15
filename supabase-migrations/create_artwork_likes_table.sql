-- Create artwork_likes table to track likes on artwork
CREATE TABLE IF NOT EXISTS artwork_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artwork_id UUID NOT NULL REFERENCES artwork(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(artwork_id, user_id) -- Prevent duplicate likes
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_artwork_likes_artwork_id ON artwork_likes(artwork_id);
CREATE INDEX IF NOT EXISTS idx_artwork_likes_user_id ON artwork_likes(user_id);

-- Enable Row Level Security
ALTER TABLE artwork_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read likes
CREATE POLICY "Anyone can read artwork likes" ON artwork_likes
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can like artwork
CREATE POLICY "Authenticated users can like artwork" ON artwork_likes
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = user_id);

-- Policy: Users can unlike their own likes
CREATE POLICY "Users can unlike artwork" ON artwork_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE artwork_likes IS 'Tracks user likes on artwork pieces';


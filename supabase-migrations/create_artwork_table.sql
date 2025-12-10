-- Create artwork table for storing user artwork
-- This table stores all artwork uploaded by users

CREATE TABLE IF NOT EXISTS artwork (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  medium TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_artwork_created_at ON artwork(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artwork_user_id ON artwork(user_id);

-- Enable Row Level Security
ALTER TABLE artwork ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read artwork
CREATE POLICY "Anyone can read artwork" ON artwork
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create artwork
CREATE POLICY "Authenticated users can create artwork" ON artwork
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own artwork
CREATE POLICY "Users can update their own artwork" ON artwork
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own artwork
CREATE POLICY "Users can delete their own artwork" ON artwork
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE artwork IS 'Stores artwork uploaded by users';


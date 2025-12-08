-- Create commission_posts table for storing commission job postings
-- This table stores all commission posts made by users

CREATE TABLE IF NOT EXISTS commission_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  budget_min DECIMAL(10, 2) NOT NULL,
  budget_max DECIMAL(10, 2) NOT NULL,
  location TEXT,
  is_remote BOOLEAN DEFAULT false,
  deadline DATE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  client_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_commission_posts_created_at ON commission_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_commission_posts_user_id ON commission_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_commission_posts_category ON commission_posts(category);
CREATE INDEX IF NOT EXISTS idx_commission_posts_type ON commission_posts(type);
CREATE INDEX IF NOT EXISTS idx_commission_posts_is_remote ON commission_posts(is_remote);

-- Enable Row Level Security
ALTER TABLE commission_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read commission posts
CREATE POLICY "Anyone can read commission posts" ON commission_posts
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create commission posts
CREATE POLICY "Authenticated users can create commission posts" ON commission_posts
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own commission posts
CREATE POLICY "Users can update their own commission posts" ON commission_posts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own commission posts
CREATE POLICY "Users can delete their own commission posts" ON commission_posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE commission_posts IS 'Stores commission job postings made by users';


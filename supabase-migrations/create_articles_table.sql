-- Create articles table
-- Stores articles posted by users in the Resources section
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  read_time TEXT DEFAULT '5 min read'
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_articles_user_id ON articles(user_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- Add comments
COMMENT ON TABLE articles IS 'Stores articles posted by users in the Resources section';
COMMENT ON COLUMN articles.title IS 'The title of the article';
COMMENT ON COLUMN articles.excerpt IS 'Brief summary/excerpt of the article';
COMMENT ON COLUMN articles.category IS 'Category of the article (Marketing, Techniques, Business, Tutorials, Photography)';
COMMENT ON COLUMN articles.content IS 'Full content of the article';
COMMENT ON COLUMN articles.author IS 'Name of the article author';
COMMENT ON COLUMN articles.read_time IS 'Estimated reading time (e.g., "5 min read")';

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can read articles (public read access)
CREATE POLICY "Anyone can read articles"
  ON articles
  FOR SELECT
  USING (true);

-- Authenticated users can create articles (membership check is handled in API route)
CREATE POLICY "Authenticated users can create articles"
  ON articles
  FOR INSERT
  WITH CHECK (
    auth.role() = 'authenticated'
    AND auth.uid() = user_id
  );

-- Users can update their own articles
CREATE POLICY "Users can update their own articles"
  ON articles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own articles
CREATE POLICY "Users can delete their own articles"
  ON articles
  FOR DELETE
  USING (auth.uid() = user_id);


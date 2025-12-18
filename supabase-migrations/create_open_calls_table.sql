-- Create open_calls table for storing open call opportunities
-- This table stores all open calls made by users (exhibitions, residencies, competitions, etc.)

CREATE TABLE IF NOT EXISTS open_calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  city TEXT,
  state TEXT,
  country TEXT,
  is_remote BOOLEAN DEFAULT false,
  deadline DATE NOT NULL,
  prizes TEXT,
  application_fee DECIMAL(10, 2) DEFAULT 0,
  fee_currency TEXT DEFAULT 'USD',
  view_count INTEGER DEFAULT 0,
  contact_email TEXT NOT NULL,
  gallery_name TEXT,
  website TEXT NOT NULL,
  header_image TEXT,
  organizer_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_open_calls_created_at ON open_calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_open_calls_user_id ON open_calls(user_id);
CREATE INDEX IF NOT EXISTS idx_open_calls_category ON open_calls(category);
CREATE INDEX IF NOT EXISTS idx_open_calls_type ON open_calls(type);
CREATE INDEX IF NOT EXISTS idx_open_calls_is_remote ON open_calls(is_remote);
CREATE INDEX IF NOT EXISTS idx_open_calls_deadline ON open_calls(deadline);
CREATE INDEX IF NOT EXISTS idx_open_calls_country ON open_calls(country);
CREATE INDEX IF NOT EXISTS idx_open_calls_city ON open_calls(city);

-- Enable Row Level Security
ALTER TABLE open_calls ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read open calls
CREATE POLICY "Anyone can read open calls" ON open_calls
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create open calls
CREATE POLICY "Authenticated users can create open calls" ON open_calls
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own open calls
CREATE POLICY "Users can update their own open calls" ON open_calls
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own open calls
CREATE POLICY "Users can delete their own open calls" ON open_calls
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comment to table
COMMENT ON TABLE open_calls IS 'Stores open call opportunities (exhibitions, residencies, competitions, grants, etc.) made by users';

-- Create visitor_events table for tracking page visits
-- This table stores all visitor tracking data

CREATE TABLE IF NOT EXISTS visitor_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  page TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  region TEXT,
  city TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visitor_events_created_at ON visitor_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_events_page ON visitor_events(page);
CREATE INDEX IF NOT EXISTS idx_visitor_events_country ON visitor_events(country);

-- Add comment to table
COMMENT ON TABLE visitor_events IS 'Stores visitor tracking data for analytics';


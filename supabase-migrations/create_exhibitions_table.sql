-- Create exhibitions table for community exhibitions
-- This table stores all exhibition information

CREATE TABLE IF NOT EXISTS exhibitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  location TEXT NOT NULL,
  host_id UUID NOT NULL,
  host_name TEXT NOT NULL,
  visitor_count INTEGER DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_exhibitions_start_date ON exhibitions(start_date);
CREATE INDEX IF NOT EXISTS idx_exhibitions_end_date ON exhibitions(end_date);
CREATE INDEX IF NOT EXISTS idx_exhibitions_host_id ON exhibitions(host_id);
CREATE INDEX IF NOT EXISTS idx_exhibitions_created_at ON exhibitions(created_at DESC);

-- Add comment to table
COMMENT ON TABLE exhibitions IS 'Stores community exhibition information';


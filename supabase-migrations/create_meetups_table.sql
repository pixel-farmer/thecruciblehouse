-- Create meetups table for community events
-- This table stores all meetup/event information

CREATE TABLE IF NOT EXISTS meetups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  host_id UUID NOT NULL,
  host_name TEXT NOT NULL,
  attendee_count INTEGER DEFAULT 0
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_meetups_event_time ON meetups(event_time);
CREATE INDEX IF NOT EXISTS idx_meetups_host_id ON meetups(host_id);
CREATE INDEX IF NOT EXISTS idx_meetups_created_at ON meetups(created_at DESC);

-- Add comment to table
COMMENT ON TABLE meetups IS 'Stores community meetup and event information';


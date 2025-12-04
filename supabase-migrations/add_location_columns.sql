-- Add location columns to visitor_events table
-- Run this migration if your table doesn't have country, region, city columns yet

ALTER TABLE visitor_events 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index on country for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_visitor_events_country ON visitor_events(country);

-- Update comment
COMMENT ON COLUMN visitor_events.country IS 'Country from IP geolocation';
COMMENT ON COLUMN visitor_events.region IS 'Region/State from IP geolocation';
COMMENT ON COLUMN visitor_events.city IS 'City from IP geolocation';


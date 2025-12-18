-- Update open_calls table to add new fields
-- Run this if the table already exists

-- Add new columns if they don't exist
ALTER TABLE open_calls 
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS prizes TEXT,
  ADD COLUMN IF NOT EXISTS application_fee DECIMAL(10, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_currency TEXT DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS header_image TEXT,
  ADD COLUMN IF NOT EXISTS gallery_name TEXT;

-- Make deadline required (if it wasn't already)
ALTER TABLE open_calls 
  ALTER COLUMN deadline SET NOT NULL;

-- Remove old location column if it exists (migrate data first if needed)
-- ALTER TABLE open_calls DROP COLUMN IF EXISTS location;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_open_calls_country ON open_calls(country);
CREATE INDEX IF NOT EXISTS idx_open_calls_city ON open_calls(city);

-- Update existing rows to set view_count to 0 if null
UPDATE open_calls SET view_count = 0 WHERE view_count IS NULL;

-- Add all missing columns to open_calls table
-- Run this in Supabase SQL Editor to fix missing column errors

-- Add all columns that might be missing
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
DO $$ 
BEGIN
  -- Check if deadline is nullable and make it NOT NULL if needed
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'open_calls' 
      AND column_name = 'deadline' 
      AND is_nullable = 'YES'
  ) THEN
    -- First, set any NULL deadlines to a future date (or handle as needed)
    UPDATE open_calls SET deadline = CURRENT_DATE + INTERVAL '30 days' WHERE deadline IS NULL;
    
    -- Then make it NOT NULL
    ALTER TABLE open_calls ALTER COLUMN deadline SET NOT NULL;
  END IF;
END $$;

-- Make website required (if it wasn't already)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'open_calls' 
      AND column_name = 'website' 
      AND is_nullable = 'YES'
  ) THEN
    -- First, set any NULL websites to a placeholder (or handle as needed)
    UPDATE open_calls SET website = 'https://example.com' WHERE website IS NULL;
    
    -- Then make it NOT NULL
    ALTER TABLE open_calls ALTER COLUMN website SET NOT NULL;
  END IF;
END $$;

-- Create indexes for new columns (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_open_calls_country ON open_calls(country);
CREATE INDEX IF NOT EXISTS idx_open_calls_city ON open_calls(city);

-- Update existing rows to set view_count to 0 if null
UPDATE open_calls SET view_count = 0 WHERE view_count IS NULL;

-- Verify all columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'open_calls' 
ORDER BY ordinal_position;

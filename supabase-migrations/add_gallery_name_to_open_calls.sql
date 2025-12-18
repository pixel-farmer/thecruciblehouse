-- Add gallery_name column to open_calls table if it doesn't exist
-- Run this in Supabase SQL Editor

ALTER TABLE open_calls 
  ADD COLUMN IF NOT EXISTS gallery_name TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'open_calls' 
  AND column_name = 'gallery_name';

-- Update open_calls table: Replace contact_phone with website
-- Run this if the table already exists with contact_phone column

-- Add website column if it doesn't exist (temporarily nullable)
ALTER TABLE open_calls 
  ADD COLUMN IF NOT EXISTS website TEXT;

-- Set a default value for existing rows (you'll need to update these manually)
-- UPDATE open_calls SET website = 'https://example.com' WHERE website IS NULL;

-- Make website required (only run this after all rows have a website value)
-- ALTER TABLE open_calls 
--   ALTER COLUMN website SET NOT NULL;

-- Remove contact_phone column
ALTER TABLE open_calls 
  DROP COLUMN IF EXISTS contact_phone;

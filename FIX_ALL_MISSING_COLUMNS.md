# Fix All Missing Columns in open_calls Table

Your `open_calls` table is missing several columns. Run this SQL in your Supabase SQL Editor to add all missing columns at once.

## Quick Fix - Run This SQL:

```sql
-- Add all missing columns to open_calls table
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
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'open_calls' 
      AND column_name = 'deadline' 
      AND is_nullable = 'YES'
  ) THEN
    UPDATE open_calls SET deadline = CURRENT_DATE + INTERVAL '30 days' WHERE deadline IS NULL;
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
    UPDATE open_calls SET website = 'https://example.com' WHERE website IS NULL;
    ALTER TABLE open_calls ALTER COLUMN website SET NOT NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_open_calls_country ON open_calls(country);
CREATE INDEX IF NOT EXISTS idx_open_calls_city ON open_calls(city);

-- Update existing rows
UPDATE open_calls SET view_count = 0 WHERE view_count IS NULL;
```

## Steps:

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Paste the SQL above
4. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Verify it worked:

After running, verify all columns exist:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'open_calls' 
ORDER BY ordinal_position;
```

You should see all these columns:
- `id`
- `user_id`
- `title`
- `description`
- `category`
- `type`
- `city` ✅
- `state` ✅
- `country` ✅
- `is_remote`
- `deadline`
- `prizes` ✅
- `application_fee` ✅
- `fee_currency` ✅
- `view_count` ✅
- `contact_email`
- `gallery_name` ✅
- `website`
- `header_image` ✅
- `organizer_name`
- `created_at`

After running this, try posting an open call again - it should work!

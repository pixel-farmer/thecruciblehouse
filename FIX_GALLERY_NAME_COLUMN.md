# Fix Missing gallery_name Column

The `gallery_name` column is missing from your `open_calls` table. Run this SQL in your Supabase SQL Editor:

```sql
-- Add gallery_name column to open_calls table
ALTER TABLE open_calls 
  ADD COLUMN IF NOT EXISTS gallery_name TEXT;
```

## Steps:

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Paste the SQL above
4. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Verify it worked:

After running, you can verify the column exists by running:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'open_calls' 
  AND column_name = 'gallery_name';
```

This should return one row showing the `gallery_name` column.

## Alternative: Run the full update migration

If you want to ensure all columns are up to date, you can run the complete update migration:

```sql
-- Add all missing columns
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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_open_calls_country ON open_calls(country);
CREATE INDEX IF NOT EXISTS idx_open_calls_city ON open_calls(city);

-- Update existing rows to set view_count to 0 if null
UPDATE open_calls SET view_count = 0 WHERE view_count IS NULL;
```

After running this, try posting an open call again.

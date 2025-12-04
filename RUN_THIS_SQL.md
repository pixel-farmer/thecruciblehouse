# Run This SQL in Supabase

## Copy and paste this SQL into your Supabase SQL Editor:

```sql
ALTER TABLE visitor_events 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_visitor_events_country ON visitor_events(country);
```

## Steps to Run:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query** button
5. Paste the SQL above into the editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see "Success. No rows returned" if it worked

## What This Does:

- ✅ Adds `country` column (TEXT, nullable)
- ✅ Adds `region` column (TEXT, nullable)  
- ✅ Adds `city` column (TEXT, nullable)
- ✅ Creates an index on `country` for faster queries
- ✅ Uses `IF NOT EXISTS` so it's safe to run multiple times
- ✅ Won't affect existing rows (columns will be NULL for old records)

After running this, new visitor tracking will automatically include location data!


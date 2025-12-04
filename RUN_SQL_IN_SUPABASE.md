# How to Add Location Columns to visitor_events Table

## ⚠️ I Cannot Run This For You
I don't have access to execute SQL on your Supabase database. Please follow these steps:

## Step-by-Step Instructions:

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project (The Crucible House)

### 2. Open SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New Query** button

### 3. Copy and Paste This SQL:

```sql
ALTER TABLE visitor_events 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

CREATE INDEX IF NOT EXISTS idx_visitor_events_country ON visitor_events(country);
```

### 4. Execute
- Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
- You should see "Success. No rows returned" message

### 5. Verify It Worked
- Go to **Table Editor** → `visitor_events`
- You should see new columns: `country`, `region`, `city`

## What This Does:
✅ Adds `country`, `region`, `city` columns (all TEXT, nullable)  
✅ Creates an index on `country` for faster queries  
✅ Safe to run multiple times (uses `IF NOT EXISTS`)  
✅ Won't break existing data (old rows will have NULL values)  

## After Running:
- New visitor tracking will automatically include location data
- Admin dashboard will display location information
- Existing records will show "Unknown" until new visits are tracked

## Troubleshooting:
If you get an error, check:
- You're connected to the correct project
- The table name is exactly `visitor_events`
- You have the correct permissions


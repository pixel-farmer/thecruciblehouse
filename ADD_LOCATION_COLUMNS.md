# Add Location Columns to Database

## Overview
To restore location information in the admin dashboard, you need to add location columns to your Supabase `visitor_events` table.

## Migration Steps

1. **Go to your Supabase Dashboard**
   - Navigate to **SQL Editor**
   - Click **New Query**

2. **Run the Migration SQL**
   Copy and paste this SQL (also saved in `supabase-migrations/add_location_columns.sql`):

```sql
-- Add location columns to visitor_events table
ALTER TABLE visitor_events 
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS region TEXT,
ADD COLUMN IF NOT EXISTS city TEXT;

-- Create index on country for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_visitor_events_country ON visitor_events(country);
```

3. **Click Run** to execute the migration

4. **Verify the columns were added**
   - Go to **Table Editor** → `visitor_events`
   - You should see new columns: `country`, `region`, `city`

## What Changed in Code

1. **Database Interface** (`app/lib/visitor-tracking.ts`):
   - Added `country`, `region`, `city` to `VisitorEventRow` interface
   - Updated `addVisitor()` to save location data
   - Updated `rowToVisitor()` to include location data

2. **Stats API** (`app/api/visitors/stats/route.ts`):
   - Returns location data in the `recent` array

3. **Admin Dashboard** (`app/admin/components/AdminDashboard.tsx`):
   - Added "Location" column back to the table
   - Displays location as "City, Region, Country" or just "Country" or "Unknown"

## Note

- **Existing data**: Old visitor records won't have location data until new visits are tracked
- **Geolocation**: Location is determined from IP address using ip-api.com (free tier, 45 requests/minute)
- **Privacy**: IP addresses are still hashed for privacy, but location (country/region/city) is stored for analytics

After running the migration, new visitor tracking will automatically include location data!


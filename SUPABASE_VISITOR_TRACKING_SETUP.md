# Supabase Visitor Tracking Setup

## Overview
Visitor tracking has been migrated from Vercel Blob to Supabase database. This eliminates race conditions and provides better reliability.

## Environment Variables

You need to add one additional environment variable in Vercel:

### SUPABASE_SERVICE_ROLE_KEY
- Your Supabase service role key (from Supabase dashboard → Settings → API)
- This key has full database access and bypasses Row Level Security (RLS)
- **Important**: Never expose this to the client-side - it's server-only
- Add this in Vercel: Settings → Environment Variables

## Database Setup

### 1. Run the Migration SQL

Go to your Supabase dashboard:
1. Navigate to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `supabase-migrations/create_visitor_events_table.sql`
4. Click **Run**

Or use the Supabase CLI:
```bash
supabase migration up
```

### 2. Verify Table Creation

In Supabase dashboard → **Table Editor**, you should see:
- Table name: `visitor_events`
- Columns:
  - `id` (UUID, primary key)
  - `created_at` (timestamp)
  - `page` (text)
  - `ip_hash` (text, nullable)
  - `user_agent` (text, nullable)
  - `referer` (text, nullable)
  - `country` (text, nullable)
  - `region` (text, nullable)
  - `city` (text, nullable)

## How It Works

1. **Visitor Tracking**: Each page visit is inserted as a new row in `visitor_events` table
2. **No Race Conditions**: Database transactions ensure data integrity
3. **IP Privacy**: IP addresses are hashed before storage
4. **Automatic Timestamps**: `created_at` is automatically set by the database

## Migration from Blob

If you have existing visitor data in Vercel Blob:
1. Use the `/api/visitors/recover` endpoint to view existing data
2. Manually migrate if needed (or start fresh with Supabase)

## Benefits

- ✅ No race conditions - database handles concurrency
- ✅ Better performance - optimized queries with indexes
- ✅ Scalable - handles high traffic better
- ✅ Reliable - database transactions ensure data integrity
- ✅ Queryable - easy to filter, sort, and analyze data


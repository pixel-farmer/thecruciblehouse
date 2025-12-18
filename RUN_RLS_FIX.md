# Fix RLS for visitor_events Table

## Issue
Supabase is showing a security warning that RLS (Row-Level Security) is disabled on the `visitor_events` table. This needs to be fixed to secure your database.

## Solution
Run the SQL migration to enable RLS and block all client-side access. Since all access to `visitor_events` is done server-side using the service role key (which bypasses RLS), this is safe and correct.

## Steps to Fix

### 1. Open Supabase Dashboard
- Go to: https://supabase.com/dashboard
- Select your project (The Crucible House)

### 2. Open SQL Editor
- Click **SQL Editor** in the left sidebar
- Click **New Query** button

### 3. Copy and Paste This SQL:

```sql
-- Fix RLS for visitor_events table
-- This table is accessed only via service role (server-side), so we block all client access

-- Enable RLS if not already enabled
ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Service role can insert visitor events" ON public.visitor_events;
DROP POLICY IF EXISTS "Service role can read visitor events" ON public.visitor_events;
DROP POLICY IF EXISTS "Block all client access to visitor_events" ON public.visitor_events;

-- Block all client-side access (anon and authenticated roles)
-- Service role bypasses RLS, so server-side API calls will still work
CREATE POLICY "Block all client access to visitor_events" ON public.visitor_events
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Add comment explaining the security model
COMMENT ON TABLE public.visitor_events IS 
  'Visitor tracking data. Access is restricted to service role only (server-side API). 
   RLS blocks all client-side access for security.';
```

### 4. Execute
- Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`)
- You should see "Success. No rows returned" message

### 5. Verify It Worked
- Go to **Table Editor** → `visitor_events`
- Click on the **Policies** tab
- You should see RLS is enabled and the policy is active
- The Supabase security warning should disappear

## What This Does

✅ **Enables RLS** on `visitor_events` table  
✅ **Blocks all client-side access** (anon and authenticated roles)  
✅ **Allows server-side access** (service role bypasses RLS automatically)  
✅ **Fixes the security warning** from Supabase  
✅ **Safe to run multiple times** (uses `IF EXISTS` and `DROP POLICY IF EXISTS`)

## Why This Is Safe

- All access to `visitor_events` is done server-side using `SUPABASE_SERVICE_ROLE_KEY`
- The service role key **bypasses RLS entirely**, so your API routes will continue to work
- Blocking client-side access prevents unauthorized reads/writes from the browser
- This is the correct security model for analytics/tracking data

## After Running

- Your visitor tracking will continue to work normally (it uses service role)
- The Supabase security warning will be resolved
- Client-side code cannot access visitor_events (as intended)

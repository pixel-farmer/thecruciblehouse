# Fix RLS for All Three Tables

## Summary
You have three tables that need RLS enabled:
1. ✅ `visitor_events` - Already fixed
2. `commission_posts` - Needs fix
3. `meetups` - Needs fix  
4. `exhibitions` - Needs fix

## Quick Fix Instructions

### Option 1: Run Each Fix Separately

Run each SQL file in your Supabase SQL Editor:

1. **commission_posts**: Copy and run `supabase-migrations/fix_commission_posts_rls_complete.sql`
2. **meetups**: Copy and run `supabase-migrations/fix_meetups_rls_complete.sql`
3. **exhibitions**: Copy and run `supabase-migrations/fix_exhibitions_rls_complete.sql`

### Option 2: Run All Three at Once

Copy and paste this combined SQL into Supabase SQL Editor:

```sql
-- ============================================
-- Fix 1: commission_posts
-- ============================================
ALTER TABLE public.commission_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Authenticated users can create commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Users can update their own commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Users can delete their own commission posts" ON public.commission_posts;

CREATE POLICY "Anyone can read commission posts" ON public.commission_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create commission posts" ON public.commission_posts
  FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own commission posts" ON public.commission_posts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commission posts" ON public.commission_posts
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================
-- Fix 2: meetups
-- ============================================
ALTER TABLE public.meetups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view meetups" ON public.meetups;
DROP POLICY IF EXISTS "Authenticated users can create meetups" ON public.meetups;
DROP POLICY IF EXISTS "Hosts can update their own meetups" ON public.meetups;
DROP POLICY IF EXISTS "Hosts can delete their own meetups" ON public.meetups;

CREATE POLICY "Anyone can view meetups" ON public.meetups
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create meetups" ON public.meetups
  FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Hosts can update their own meetups" ON public.meetups
  FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own meetups" ON public.meetups
  FOR DELETE TO authenticated USING (auth.uid() = host_id);

-- ============================================
-- Fix 3: exhibitions
-- ============================================
ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view exhibitions" ON public.exhibitions;
DROP POLICY IF EXISTS "Authenticated users can create exhibitions" ON public.exhibitions;
DROP POLICY IF EXISTS "Hosts can update their own exhibitions" ON public.exhibitions;
DROP POLICY IF EXISTS "Hosts can delete their own exhibitions" ON public.exhibitions;

CREATE POLICY "Anyone can view exhibitions" ON public.exhibitions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create exhibitions" ON public.exhibitions
  FOR INSERT TO authenticated WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Hosts can update their own exhibitions" ON public.exhibitions
  FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their own exhibitions" ON public.exhibitions
  FOR DELETE TO authenticated USING (auth.uid() = host_id);
```

## What Each Fix Does

### commission_posts
- ✅ Public read access (anyone can view commission posts)
- ✅ Authenticated users can create posts
- ✅ Users can update/delete their own posts (where `user_id` = `auth.uid()`)

### meetups
- ✅ Public read access (anyone can view meetups)
- ✅ Authenticated users can create meetups
- ✅ Hosts can update/delete their own meetups (where `host_id` = `auth.uid()`)

### exhibitions
- ✅ Public read access (anyone can view exhibitions)
- ✅ Authenticated users can create exhibitions
- ✅ Hosts can update/delete their own exhibitions (where `host_id` = `auth.uid()`)

## After Running

1. All three Supabase security warnings should disappear
2. Your application will continue to work normally
3. All tables will be properly secured with RLS

## Verification

After running, you can verify RLS is enabled by running this query:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('commission_posts', 'meetups', 'exhibitions')
AND schemaname = 'public';
```

All three should show `rowsecurity = true`.

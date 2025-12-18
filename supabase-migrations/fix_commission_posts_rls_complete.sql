-- Complete RLS fix for commission_posts table
-- Run this in Supabase SQL Editor to fix the security warning

-- Step 1: Enable RLS (this will block all access until policies are created)
ALTER TABLE public.commission_posts ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can read commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Authenticated users can create commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Users can update their own commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Users can delete their own commission posts" ON public.commission_posts;

-- Step 3: Create policies

-- Policy 1: Anyone (including anonymous users) can read commission posts
-- This allows public viewing of commission job postings
CREATE POLICY "Anyone can read commission posts" ON public.commission_posts
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can create commission posts
-- Note: Pro membership check is done in application layer
CREATE POLICY "Authenticated users can create commission posts" ON public.commission_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Users can update their own commission posts
-- Only the owner (user_id matches auth.uid()) can update
CREATE POLICY "Users can update their own commission posts" ON public.commission_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own commission posts
-- Only the owner (user_id matches auth.uid()) can delete
CREATE POLICY "Users can delete their own commission posts" ON public.commission_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Verify: Check that RLS is enabled (this should return 't' for true)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'commission_posts';

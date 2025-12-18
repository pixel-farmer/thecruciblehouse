-- Complete RLS fix for exhibitions table
-- Run this in Supabase SQL Editor to fix the security warning

-- Step 1: Enable RLS (this will block all access until policies are created)
ALTER TABLE public.exhibitions ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can view exhibitions" ON public.exhibitions;
DROP POLICY IF EXISTS "Authenticated users can create exhibitions" ON public.exhibitions;
DROP POLICY IF EXISTS "Hosts can update their own exhibitions" ON public.exhibitions;
DROP POLICY IF EXISTS "Hosts can delete their own exhibitions" ON public.exhibitions;

-- Step 3: Create policies

-- Policy 1: Anyone (including anonymous users) can read exhibitions
-- This allows public viewing of community exhibitions
CREATE POLICY "Anyone can view exhibitions" ON public.exhibitions
  FOR SELECT
  USING (true);

-- Policy 2: Authenticated users can create exhibitions
-- Note: Pro membership check is done in application layer
CREATE POLICY "Authenticated users can create exhibitions" ON public.exhibitions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Hosts can update their own exhibitions
-- Only the host (host_id matches auth.uid()) can update
CREATE POLICY "Hosts can update their own exhibitions" ON public.exhibitions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Policy 4: Hosts can delete their own exhibitions
-- Only the host (host_id matches auth.uid()) can delete
CREATE POLICY "Hosts can delete their own exhibitions" ON public.exhibitions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = host_id);

-- Verify: Check that RLS is enabled (this should return 't' for true)
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'exhibitions';

-- Fix RLS for commission_posts table
-- This table stores commission job postings with user ownership

-- Enable RLS if not already enabled
ALTER TABLE public.commission_posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can read commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Authenticated users can create commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Users can update their own commission posts" ON public.commission_posts;
DROP POLICY IF EXISTS "Users can delete their own commission posts" ON public.commission_posts;

-- Policy: Anyone can read commission posts (public read access)
CREATE POLICY "Anyone can read commission posts" ON public.commission_posts
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create commission posts
CREATE POLICY "Authenticated users can create commission posts" ON public.commission_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own commission posts
CREATE POLICY "Users can update their own commission posts" ON public.commission_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own commission posts
CREATE POLICY "Users can delete their own commission posts" ON public.commission_posts
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comment explaining the security model
COMMENT ON TABLE public.commission_posts IS 
  'Stores commission job postings. Public read access, authenticated users can create, 
   users can update/delete their own posts.';

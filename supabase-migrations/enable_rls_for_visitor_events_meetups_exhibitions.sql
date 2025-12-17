-- Enable Row Level Security on tables that were missing it
-- This fixes the Supabase security warnings about RLS being disabled on public tables

-- ============================================
-- visitor_events table
-- ============================================
ALTER TABLE visitor_events ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert visitor events (through API)
-- Since visitor tracking is done server-side with service role key,
-- we don't allow direct client inserts
CREATE POLICY "Service role can insert visitor events" ON visitor_events
  FOR INSERT
  WITH CHECK (false); -- Disable all direct client inserts - API uses service role

-- Policy: Only service role can read visitor events (admin analytics)
-- Analytics data should not be accessible via client-side API
CREATE POLICY "Service role can read visitor events" ON visitor_events
  FOR SELECT
  USING (false); -- Disable all direct client reads - API uses service role

-- ============================================
-- meetups table
-- ============================================
ALTER TABLE meetups ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view meetups (public read access)
CREATE POLICY "Anyone can view meetups" ON meetups
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create meetups
-- (Pro membership is checked in application layer)
CREATE POLICY "Authenticated users can create meetups" ON meetups
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Hosts can update their own meetups
CREATE POLICY "Hosts can update their own meetups" ON meetups
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Policy: Hosts can delete their own meetups
CREATE POLICY "Hosts can delete their own meetups" ON meetups
  FOR DELETE
  USING (auth.uid() = host_id);

-- ============================================
-- exhibitions table
-- ============================================
ALTER TABLE exhibitions ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view exhibitions (public read access)
CREATE POLICY "Anyone can view exhibitions" ON exhibitions
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can create exhibitions
-- (Pro membership is checked in application layer)
CREATE POLICY "Authenticated users can create exhibitions" ON exhibitions
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Hosts can update their own exhibitions
CREATE POLICY "Hosts can update their own exhibitions" ON exhibitions
  FOR UPDATE
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);

-- Policy: Hosts can delete their own exhibitions
CREATE POLICY "Hosts can delete their own exhibitions" ON exhibitions
  FOR DELETE
  USING (auth.uid() = host_id);


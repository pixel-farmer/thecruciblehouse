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

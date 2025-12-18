-- Create RPC function to increment open call view count
-- This function bypasses RLS and allows anyone to increment view counts

CREATE OR REPLACE FUNCTION increment_open_call_views(call_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  -- Increment view count atomically
  UPDATE open_calls
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = call_id
  RETURNING view_count INTO new_count;
  
  -- Return the new count, or 0 if the open call doesn't exist
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION increment_open_call_views(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_open_call_views(UUID) TO anon;

-- Add comment
COMMENT ON FUNCTION increment_open_call_views(UUID) IS 
  'Increments the view_count for an open call. Can be called by anyone (authenticated or anonymous).';

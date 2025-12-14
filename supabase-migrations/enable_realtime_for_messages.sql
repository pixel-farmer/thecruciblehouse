-- Enable real-time for the messages table
-- This allows clients to subscribe to changes via postgres_changes

-- Add messages table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;


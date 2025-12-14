-- Create groups table for community groups
-- This table stores all group information

CREATE TABLE IF NOT EXISTS groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_groups_is_active ON groups(is_active);
CREATE INDEX IF NOT EXISTS idx_groups_created_at ON groups(created_at DESC);

-- Create group_members table to track user-group relationships
CREATE TABLE IF NOT EXISTS group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(group_id, user_id)
);

-- Create indexes for group_members
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Add comments
COMMENT ON TABLE groups IS 'Stores community group information';
COMMENT ON TABLE group_members IS 'Stores user-group membership relationships';

-- Enable Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for groups
-- Anyone can read active groups
CREATE POLICY "Anyone can view active groups"
  ON groups FOR SELECT
  USING (is_active = true);

-- RLS Policies for group_members
-- Anyone can view group memberships (for counting)
CREATE POLICY "Anyone can view group members"
  ON group_members FOR SELECT
  USING (true);

-- Authenticated users can join groups
CREATE POLICY "Authenticated users can join groups"
  ON group_members FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can leave groups they're in
CREATE POLICY "Users can leave groups"
  ON group_members FOR DELETE
  USING (auth.uid() = user_id);

-- Insert the "Art Business Blueprint" group
INSERT INTO groups (name, description, member_count, is_active)
VALUES (
  'Art Business Blueprint',
  'Pricing, client, and sales advice.',
  0,
  true
)
ON CONFLICT DO NOTHING;


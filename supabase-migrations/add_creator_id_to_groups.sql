-- Add creator_id column to groups table
-- This tracks who created each group

ALTER TABLE groups
ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_groups_creator_id ON groups(creator_id);

-- Add comment
COMMENT ON COLUMN groups.creator_id IS 'The user who created this group';

-- Add RLS policy for creating groups (Pro/Founder users only)
-- We'll check membership in the application layer, but allow authenticated users to insert
-- The API will verify Pro/Founder status before allowing creation
DROP POLICY IF EXISTS "Pro users can create groups" ON groups;
CREATE POLICY "Authenticated users can create groups"
  ON groups FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = creator_id);

-- Allow group creators to update their own groups
DROP POLICY IF EXISTS "Creators can update their groups" ON groups;
CREATE POLICY "Creators can update their groups"
  ON groups FOR UPDATE
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Allow group creators to delete their own groups
DROP POLICY IF EXISTS "Creators can delete their groups" ON groups;
CREATE POLICY "Creators can delete their groups"
  ON groups FOR DELETE
  USING (auth.uid() = creator_id);


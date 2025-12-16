-- Delete the "Art Business Blueprint" group
-- This will also cascade delete all group_members entries due to CASCADE on DELETE
-- Note: You may need to run this with service role permissions or disable RLS temporarily

-- Option 1: If you're the creator, you can use the web UI or API
-- Option 2: Run this SQL directly (may require service role if RLS blocks it)

DELETE FROM groups
WHERE name = 'Art Business Blueprint';


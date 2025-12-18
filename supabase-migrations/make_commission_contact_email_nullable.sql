-- Make contact_email nullable in commission_posts table
-- This allows commission posts to be created without an email address
-- Users can then use the "Send Message" feature instead

ALTER TABLE commission_posts 
ALTER COLUMN contact_email DROP NOT NULL;

COMMENT ON COLUMN commission_posts.contact_email IS 'Contact email (optional - users can message through the site instead)';

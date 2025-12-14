-- Add banner_image_url column to meetups table
ALTER TABLE meetups 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

COMMENT ON COLUMN meetups.banner_image_url IS 'URL to the banner image for the meetup (stored in Supabase Storage)';

-- Add banner_image_url column to exhibitions table
ALTER TABLE exhibitions 
ADD COLUMN IF NOT EXISTS banner_image_url TEXT;

COMMENT ON COLUMN exhibitions.banner_image_url IS 'URL to the banner image for the exhibition (stored in Supabase Storage)';


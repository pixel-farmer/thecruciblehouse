# Fix Commission Email to be Optional

## Issue
The `commission_posts` table has `contact_email` set as `NOT NULL`, which prevents posting commissions without an email address.

## Solution
Run the SQL migration to make `contact_email` nullable.

## Steps

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase-migrations/make_commission_contact_email_nullable.sql`
5. Click **Run**

## What This Does

- Removes the `NOT NULL` constraint from the `contact_email` column
- Allows commission posts to be created without an email address
- Users can then use the "Send Message" feature to contact post owners through the site

## Verification

After running the migration, you should be able to:
- Post a commission without providing an email address
- The commission will show only the "Send Message" button (no "Apply" button)

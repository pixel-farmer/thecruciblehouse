# Supabase Artwork Storage Setup

## Overview
Artwork upload functionality requires a Supabase Storage bucket to store user artwork images.

## Storage Bucket Setup

### 1. Create the Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `artwork`
5. Set it to **Public bucket** (so artwork images can be accessed via public URLs)
6. Click **Create bucket**

### 2. Set Up Storage Policies (Row Level Security)

After creating the bucket, you need to set up policies to allow users to upload their own artwork:

**Option A: Using the Policy Editor (Recommended)**

1. Go to **Storage** in the left sidebar
2. Click on the `artwork` bucket
3. Click on the **Policies** tab
4. Click **New Policy**

**Create Upload Policy (INSERT):**
1. Click **New Policy**
2. Select **For full customization** (or use the template)
3. Policy name: `Authenticated users can upload artwork`
4. Allowed operation: Select **INSERT**
5. Policy definition - paste this SQL:
   ```sql
   bucket_id = 'artwork'::text AND auth.role() = 'authenticated' AND storage.foldername(name)[1] = 'artwork'
   ```
6. Click **Review** then **Save policy**

**Create Read Policy (SELECT):**
1. Click **New Policy** again
2. Select **For full customization**
3. Policy name: `Anyone can view artwork`
4. Allowed operation: Select **SELECT**
5. Policy definition - paste this SQL:
   ```sql
   bucket_id = 'artwork'::text
   ```
6. Click **Review** then **Save policy**

**Create Delete Policy (DELETE):**
1. Click **New Policy** again
2. Select **For full customization**
3. Policy name: `Users can delete their own artwork`
4. Allowed operation: Select **DELETE**
5. Policy definition - paste this SQL:
   ```sql
   bucket_id = 'artwork'::text AND auth.role() = 'authenticated' AND storage.foldername(name)[1] = 'artwork'
   ```
6. Click **Review** then **Save policy**

**Option B: Using SQL Editor (Alternative)**

If the policy editor doesn't work, you can run this SQL in the **SQL Editor**:

```sql
-- Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can upload artwork"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'artwork'::text 
  AND storage.foldername(name)[1] = 'artwork'
);

-- Create SELECT policy for public read access
CREATE POLICY "Anyone can view artwork"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'artwork'::text);

-- Create DELETE policy for authenticated users
CREATE POLICY "Users can delete their own artwork"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'artwork'::text 
  AND storage.foldername(name)[1] = 'artwork'
);
```

### 3. Create the Artwork Database Table

Run the SQL migration file in your Supabase SQL Editor:

1. Go to **SQL Editor** in the Supabase Dashboard
2. Click **New query**
3. Copy and paste the contents of `supabase-migrations/create_artwork_table.sql`
4. Click **Run** (or press Ctrl+Enter)

This will create the `artwork` table with the necessary columns and Row Level Security policies.

## Verification

After setup, you can verify everything is working:

1. **Check the bucket exists**: Go to Storage → artwork bucket should be visible
2. **Check policies**: Go to Storage → artwork → Policies tab, you should see 3 policies
3. **Check the table**: Go to Table Editor → artwork table should exist
4. **Test upload**: Try uploading artwork from the profile page

## Troubleshooting

### "Storage bucket not found" Error
- Make sure the bucket is named exactly `artwork` (case-sensitive)
- Check that the bucket is set to **Public**

### "Permission denied" Error
- Verify that the storage policies are set up correctly
- Make sure you're logged in when trying to upload
- Check that the INSERT policy includes the correct folder path check

### "Failed to save artwork record" Error
- Make sure the `artwork` table exists in your database
- Verify that the table has the correct RLS policies enabled
- Check the SQL Editor for any error messages


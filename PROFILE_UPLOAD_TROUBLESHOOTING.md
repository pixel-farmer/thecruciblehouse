# Profile Image Upload Troubleshooting

## Common Issues and Solutions

### 1. "Storage bucket not found" Error

**Problem:** The `profile-images` storage bucket doesn't exist in Supabase.

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Name it: `profile-images`
4. Set it to **Public bucket**
5. Click "Create bucket"

See `SUPABASE_PROFILE_STORAGE_SETUP.md` for detailed instructions.

### 2. "Permission denied" or "Row-level security" Error

**Problem:** Storage policies are not set up correctly.

**Solution:**
1. Go to Supabase Dashboard → Storage → Policies
2. Select the `profile-images` bucket
3. Create these policies:

   **Upload Policy (INSERT):**
   - Policy name: `Authenticated users can upload profile images`
   - Policy definition:
     ```sql
     bucket_id = 'profile-images'::text AND auth.role() = 'authenticated' AND storage.foldername(name)[1] = 'avatars'
     ```

   **Read Policy (SELECT):**
   - Policy name: `Anyone can view profile images`
   - Policy definition:
     ```sql
     bucket_id = 'profile-images'::text
     ```

### 3. Check Browser Console

Open your browser's developer console (F12) and look for error messages when uploading. The console will show:
- Upload errors from Supabase
- Network errors
- Authentication errors

### 4. Check File Size and Type

- Maximum file size: 5MB
- Accepted file types: Any image file (jpeg, png, gif, webp, etc.)

### 5. Verify Authentication

Make sure you're logged in. The upload requires an active Supabase session.

### 6. Check Network Tab

In browser DevTools → Network tab, look for the upload request:
- Check if it's returning an error status code
- Look at the response body for error details

### Current Implementation

The profile image upload now uses **client-side upload** directly to Supabase Storage, which:
- Simplifies authentication (uses existing session)
- Provides better error messages
- Works more reliably than server-side uploads

The upload happens directly from the browser to Supabase Storage, bypassing the API endpoint entirely.


# Supabase Posts Setup

## Overview
Community posts functionality has been added to store user posts in Supabase database.

## Database Setup

### 1. Run the Migration SQL

Go to your Supabase dashboard:
1. Navigate to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `supabase-migrations/create_community_posts_table.sql`
4. Click **Run**

Or use the Supabase CLI:
```bash
supabase migration up
```

### 2. Verify Table Creation

In Supabase dashboard → **Table Editor**, you should see:
- Table name: `community_posts`
- Columns:
  - `id` (UUID, primary key)
  - `user_id` (UUID, references auth.users)
  - `content` (TEXT)
  - `created_at` (TIMESTAMP WITH TIME ZONE)
  - `user_name` (TEXT)
  - `user_handle` (TEXT)
  - `user_avatar` (TEXT)

### 3. Row Level Security (RLS)

RLS policies are automatically created:
- **Anyone can read posts** - Public read access
- **Authenticated users can create posts** - Only logged-in users can post
- **Users can update their own posts** - Users can edit only their posts
- **Users can delete their own posts** - Users can delete only their posts

## How It Works

1. **Creating Posts**: When a user clicks "Post" in the community feed:
   - The post content, user ID, name, handle, and avatar are sent to `/api/posts`
   - The API validates the content (max 280 characters)
   - The post is inserted into the `community_posts` table
   - The new post appears at the top of the feed

2. **Reading Posts**: Posts are fetched from `/api/posts`:
   - Ordered by `created_at` descending (newest first)
   - Limited to 100 most recent posts
   - Displayed with user avatar, name, handle, and relative time

3. **Authentication**: Users must be logged in to create posts. The API validates that a user ID is provided.

## API Endpoints

### GET `/api/posts`
- Fetches all posts ordered by creation date (newest first)
- Returns: `{ posts: [...] }`
- No authentication required (RLS allows public reads)

### POST `/api/posts`
- Creates a new post
- Requires: `{ content, userId, userName, userHandle, userAvatar }`
- Returns: `{ post: {...}, success: true }`
- Validates: Content is required, max 280 characters

## Environment Variables

No additional environment variables are needed. Uses existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Features

✅ **Real-time Posts** - Posts are stored in database and persist across sessions
✅ **User Information** - Each post shows the author's name, handle, and avatar
✅ **Relative Time** - Posts show "2h", "5m", "1d" etc.
✅ **Character Limit** - 280 character limit (Twitter-like)
✅ **Authentication** - Only logged-in users can post
✅ **RLS Security** - Row Level Security ensures users can only edit/delete their own posts


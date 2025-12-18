# Fix Open Call View Count Increment

## Issue
The view count for open calls is not incrementing when users view the details page. This is because the RLS policy only allows the owner to update their own open calls, blocking anonymous and other users from incrementing the view count.

## Solution
Create an RPC function that can increment view counts while bypassing RLS restrictions.

## Steps

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase-migrations/create_increment_open_call_views_function.sql`
5. Click **Run**

## What This Does

- Creates an RPC function `increment_open_call_views` that:
  - Uses `SECURITY DEFINER` to bypass RLS
  - Atomically increments the view_count for a given open call
  - Can be called by anyone (authenticated or anonymous users)
- The API route already tries to use this function first, then falls back to a direct update if it doesn't exist

## Verification

After running the migration:
1. Visit an open call details page
2. Check the view count - it should increment
3. Refresh the page - the count should increment again

The function is already being called by the API at `/api/open-calls/[id]/view`, so no code changes are needed.

# Founder Badge Setup

Founder users have the same access as Pro users. To mark a user as a Founder:

## Setting Founder Status

1. Go to Supabase Dashboard → Authentication → Users
2. Find the user you want to mark as Founder
3. Click on the user to view details
4. Go to the "Raw JSON" tab or use the SQL Editor

### Option 1: Using SQL Editor (Recommended)

Run this SQL query (replace USER_ID with the actual user ID):

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{is_founder}',
  'true'::jsonb
)
WHERE id = 'USER_ID';
```

### Option 2: Manual Edit in Dashboard

1. In the user's Raw JSON, find `raw_user_meta_data`
2. Add or update: `"is_founder": true`
3. Save

## How It Works

- **Access**: Founders have the same access as Pro users (can post articles, host meetups, create groups, etc.)
- **Badge**: Founders get a gold Founder badge (crown icon) instead of the orange Pro badge (star icon)
- **Checking Status**: The system checks for `is_founder: true` in user metadata, and if found, grants Pro-level access
- **Display**: Founder badge appears in the same places as Pro badges (profile, artist pages, community, messages, etc.)

## Removing Founder Status

To remove founder status:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'is_founder'
WHERE id = 'USER_ID';
```


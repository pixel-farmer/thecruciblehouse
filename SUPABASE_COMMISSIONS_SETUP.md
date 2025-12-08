# Supabase Commissions Setup

## Overview
Commission posting functionality has been added to store commission job postings in Supabase database.

## Database Setup

### 1. Run the Migration SQL

Go to your Supabase dashboard:
1. Navigate to **SQL Editor**
2. Click **New Query**
3. Copy and paste the SQL from `supabase-migrations/create_commission_posts_table.sql`
4. Click **Run**

Or use the Supabase CLI:
```bash
supabase migration up
```

### 2. Verify Table Creation

In Supabase dashboard → **Table Editor**, you should see:
- Table name: `commission_posts`
- Columns:
  - `id` (UUID, primary key)
  - `user_id` (UUID, references auth.users)
  - `title` (TEXT)
  - `description` (TEXT)
  - `category` (TEXT)
  - `type` (TEXT)
  - `budget_min` (DECIMAL)
  - `budget_max` (DECIMAL)
  - `location` (TEXT, nullable)
  - `is_remote` (BOOLEAN)
  - `deadline` (DATE, nullable)
  - `contact_email` (TEXT)
  - `contact_phone` (TEXT, nullable)
  - `client_name` (TEXT)
  - `created_at` (TIMESTAMP WITH TIME ZONE)

### 3. Row Level Security (RLS)

RLS policies are automatically created:
- **Anyone can read commission posts** - Public read access
- **Authenticated users can create commission posts** - Only logged-in users can post
- **Users can update their own commission posts** - Users can edit only their posts
- **Users can delete their own commission posts** - Users can delete only their posts

## How It Works

1. **Creating Commission Posts**: When a user fills out the "Post a Job" form:
   - The form data is sent to `/api/commissions` (POST)
   - The API validates required fields
   - The commission post is inserted into the `commission_posts` table
   - The user is redirected to the commissions page

2. **Reading Commission Posts**: Commission posts are fetched from `/api/commissions` (GET):
   - Ordered by `created_at` descending (newest first)
   - Limited to 100 most recent posts
   - Displayed with filtering options (category, type, location, remote)

3. **Authentication**: Users must be logged in to create commission posts. The API validates that a user ID is provided.

## API Endpoints

### GET `/api/commissions`
- Fetches all commission posts ordered by creation date (newest first)
- Returns: `{ commissions: [...] }`
- No authentication required (RLS allows public reads)

### POST `/api/commissions`
- Creates a new commission post
- Requires authentication
- Body parameters:
  - `title` (required)
  - `description` (required)
  - `category` (required)
  - `type` (required)
  - `budgetMin` (required)
  - `budgetMax` (required)
  - `location` (optional)
  - `isRemote` (optional, boolean)
  - `deadline` (optional, date string)
  - `contactEmail` (required)
  - `contactPhone` (optional)
- Returns: `{ commission: {...}, success: true }`

## Categories

The following categories are supported:
- Traditional
- 3D
- Sculpture
- Photography
- Digital
- Crafts
- Textile
- Experimental
- Other

## Types

- Personal
- Commercial


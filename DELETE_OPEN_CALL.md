# Delete Open Call

## Option 1: Use the Delete Button (Recommended)
1. Go to `/open-calls` page
2. Find your open call
3. Click the "Delete" button (only visible to you as the owner)
4. Confirm the deletion

## Option 2: Run SQL in Supabase

### Step 1: Find the Open Call ID
Run this query in Supabase SQL Editor to see all open calls:

```sql
SELECT id, title, created_at, organizer_name 
FROM open_calls 
ORDER BY created_at DESC;
```

### Step 2: Delete the Open Call
Replace `YOUR_OPEN_CALL_ID` with the actual ID from Step 1:

```sql
DELETE FROM open_calls 
WHERE id = 'YOUR_OPEN_CALL_ID';
```

## Option 3: Delete All Open Calls (if you want to start fresh)
⚠️ **Warning: This will delete ALL open calls!**

```sql
DELETE FROM open_calls;
```

# Vercel Blob Token Check

## Issue
The visitor tracking is trying to write to the filesystem on Vercel, which is read-only. This means `BLOB_READ_WRITE_TOKEN` is not being detected.

## Error Message
```
Error: ENOENT: no such file or directory, open '/var/task/data/visitors.json'
```

## Solution

### 1. Check if BLOB_READ_WRITE_TOKEN is set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Look for `BLOB_READ_WRITE_TOKEN`
4. If it's missing, you need to set it up

### 2. How to get BLOB_READ_WRITE_TOKEN

The token is automatically created when you create a Blob store:

1. Go to your Vercel project dashboard
2. Navigate to **Storage** tab
3. Create a new Blob store if you haven't already:
   - Click **Create Database**
   - Select **Blob**
   - Name it (e.g., "visitor-tracking")
   - Select a region
   - Click **Create**
4. Vercel should automatically add `BLOB_READ_WRITE_TOKEN` to your environment variables

### 3. Verify the Token is Set

After creating the Blob store:
1. Go to **Settings** → **Environment Variables**
2. You should see `BLOB_READ_WRITE_TOKEN` listed
3. Make sure it's enabled for **Production**, **Preview**, and **Development** environments

### 4. Redeploy

After setting the environment variable:
1. Go to **Deployments** tab
2. Click the three dots on the latest deployment
3. Click **Redeploy**

Or push a new commit to trigger a new deployment.

## Testing

After redeploying, check the Vercel function logs. You should see:
- `[addVisitor] Storage check: useBlob=true, isVercel=true, hasToken=true`
- `[addVisitor] Writing X visitors to blob`

If you still see filesystem errors, the token is not being detected properly.


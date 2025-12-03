# Vercel Blob Setup for Visitor Tracking

The visitor tracking system now uses Vercel Blob (free tier) for production deployments. This allows visitor data to persist on Vercel's serverless platform.

## Setup Instructions

### 1. Create a Vercel Blob Store

1. Go to your Vercel project dashboard
2. Navigate to the **Storage** tab
3. Click **Create Database**
4. Select **Blob**
5. Choose a name for your store (e.g., "visitor-tracking")
6. Select a region close to your users
7. Click **Create**

### 2. Environment Variables

Vercel will automatically add this environment variable to your project:
- `BLOB_READ_WRITE_TOKEN` - The authentication token for read/write access

This is automatically set when you create the Blob store, so you don't need to add it manually.

### 3. Redeploy Your Application

After creating the Blob store, redeploy your application:
- Push a new commit, or
- Go to your Vercel project → **Deployments** → Click the three dots on the latest deployment → **Redeploy**

## How It Works

- **Production (Vercel)**: Uses Vercel Blob to store visitor data as a JSON file
- **Local Development**: Falls back to file system (`data/visitors.json`)

The system automatically detects which storage method to use based on the presence of `BLOB_READ_WRITE_TOKEN` environment variable.

## Testing

After setup, visit your site and navigate through a few pages. Then check the admin dashboard at `/admin` - you should see visitor statistics being tracked.

## Troubleshooting

### Visitor tracking still shows 0 visits

1. **Check environment variable**: Ensure `BLOB_READ_WRITE_TOKEN` is set in your Vercel project settings
2. **Check deployment logs**: Look for any errors related to Blob in your Vercel function logs
3. **Verify Blob store**: Make sure the Blob store is created and active in your Vercel project

### Local development

For local development, visitor tracking will use the file system (`data/visitors.json`). This file is automatically created when visitors are tracked.

## Cost

Vercel Blob has a generous free tier that includes:
- 1 GB storage
- Unlimited requests
- Perfect for visitor tracking use cases

For more information, see [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob).


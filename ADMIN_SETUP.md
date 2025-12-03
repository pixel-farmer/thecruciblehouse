# Admin Section Setup Guide

This guide will help you set up the admin section with login authentication and visitor tracking.

## Environment Variables

You need to set up the following environment variables:

### Required for Authentication

1. **AUTH_SECRET** - A random secret string for JWT token encryption
   - Generate one using: `openssl rand -base64 32`
   - Or use any long random string

2. **ADMIN_PASSWORD_HASH** (Recommended) - A bcrypt hash of your admin password
   - Generate using the script: `node scripts/generate-password-hash.js`
   - Or use plain text **ADMIN_PASSWORD** (development only, not recommended for production)

### Setting Up on Vercel

1. Go to your project settings on Vercel
2. Navigate to **Environment Variables**
3. Add the following variables:

   ```
   AUTH_SECRET=your-random-secret-string-here
   ADMIN_PASSWORD_HASH=your-bcrypt-hash-here
   ```

   Or for development (not recommended for production):

   ```
   AUTH_SECRET=your-random-secret-string-here
   ADMIN_PASSWORD=your-plain-text-password-here
   ```

### Generating a Password Hash

Run the password hash generator script:

```bash
node scripts/generate-password-hash.js
```

Enter your desired password when prompted. Copy the generated hash and add it to your environment variables as `ADMIN_PASSWORD_HASH`.

## Accessing the Admin Section

1. Navigate to `/admin/login` in your browser
2. Enter your admin password
3. You'll be redirected to `/admin` dashboard

## Features

### Visitor Tracking

The admin dashboard shows:
- **Total visits** - All-time visitor count
- **Last 24 Hours** - Visits in the past day
- **Last 7 Days** - Visits in the past week
- **Last 30 Days** - Visits in the past month
- **Page Visits** - Breakdown of visits by page
- **Recent Visits** - Last 50 visits with timestamps, IPs, and user agents

### Data Storage

Visitor data is stored in `data/visitors.json`. This file is automatically created and updated as visitors browse your site.

**Note:** The file stores up to 10,000 recent visits to prevent it from growing too large. For production use with high traffic, consider upgrading to a database (PostgreSQL, MongoDB, etc.).

## Security Notes

- **Never commit** `.env.local` or `data/` directory to version control
- Use strong, unique passwords
- In production, always use `ADMIN_PASSWORD_HASH` (bcrypt hash) instead of plain text password
- Change the default password immediately
- The `data/` directory is included in `.gitignore` by default

## Troubleshooting

### Can't log in
- Verify `AUTH_SECRET` is set
- Verify `ADMIN_PASSWORD_HASH` or `ADMIN_PASSWORD` is set correctly
- Check browser console for errors

### Visitor tracking not working
- Ensure the `/api/visitors/track` endpoint is accessible
- Check server logs for errors
- Verify write permissions for the `data/` directory

### Build errors
- Make sure all environment variables are set on Vercel
- Check that `AUTH_SECRET` is at least 32 characters long


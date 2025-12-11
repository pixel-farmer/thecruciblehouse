# Local Environment Setup for Posts

## Required Environment Variables

For the posts feature to work on localhost, you need these 3 environment variables in your `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

## How to Get Your Service Role Key

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Find **service_role key** (under "Project API keys")
5. Copy it (it's the long secret key, not the anon key)

## Add to .env.local

1. Open your `.env.local` file in the project root
2. Add or update the `SUPABASE_SERVICE_ROLE_KEY` line:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your actual key)
   ```
3. **Important**: Restart your Next.js dev server after adding/changing environment variables
   - Stop the server (Ctrl+C)
   - Run `npm run dev` again

## Google Maps API Key

The community page uses Google Maps. Add your API key to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=REDACTED_GOOGLE_MAPS_KEY
```

**Important for Production:**
- Add this environment variable to your Vercel project settings (or other hosting platform)
- Make sure your Google Cloud Console API key restrictions include:
  - `http://localhost:3000/*` (for development)
  - `https://www.thecruciblehouse.com/*` (for production)

## Verify It's Working

After restarting, the posts should fetch correctly and the map should display. The error should disappear!


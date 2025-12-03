import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client with service role key
 * Use this for admin operations that need full database access
 * Never expose this client to the client-side!
 */
function createServerSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // During build phase, use placeholder to prevent build failures
  if (!supabaseUrl || !serviceRoleKey) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    
    console.error('⚠️ Supabase server credentials missing!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment variables.');
    // Return placeholder client instead of throwing to prevent runtime errors
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  // Validate URL
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error(`Invalid Supabase URL format: ${supabaseUrl}`);
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  // Create client with service role key (bypasses RLS policies)
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Create and export the server client
export const supabaseServer: SupabaseClient = createServerSupabaseClient();


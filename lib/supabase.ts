import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Track if we're using a placeholder client
let isPlaceholderClient = false;

function createSupabaseClient(): SupabaseClient {
  // During build phase, use placeholder to prevent build failures
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      isPlaceholderClient = true;
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    
    // At runtime, create a client that will fail gracefully when used
    // This allows the site to load even if env vars are missing
    console.error('⚠️ Supabase environment variables are missing!');
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.');
    isPlaceholderClient = true;
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  // Check if values are placeholders
  if (supabaseUrl.includes('your-supabase') || supabaseAnonKey.includes('your-supabase')) {
    console.error('⚠️ Supabase placeholder values detected!');
    console.error('Please replace with actual credentials in your Vercel project settings.');
    isPlaceholderClient = true;
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error(`Invalid Supabase URL format: ${supabaseUrl}`);
    isPlaceholderClient = true;
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  // Create the real client
  isPlaceholderClient = false;
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

// Create client immediately - TypeScript-friendly approach
// The client creation is safe and won't crash if env vars are missing
export const supabase: SupabaseClient = createSupabaseClient();

// Export a helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !isPlaceholderClient && !!supabaseUrl && !!supabaseAnonKey;
}


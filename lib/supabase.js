import { createClient } from '@supabase/supabase-js';

// Lazy initialization - only create client when actually accessed
let supabaseClient = null;

function getSupabaseClient() {
  // Return cached client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // During build phase, use placeholder to prevent build failures
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
      return supabaseClient;
    }
    
    // At runtime, create a client that will fail gracefully when used
    // This allows the site to load even if env vars are missing
    console.warn('Supabase environment variables are missing. Authentication features will not work.');
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return supabaseClient;
  }

  // Check if values are placeholders
  if (supabaseUrl.includes('your-supabase') || supabaseAnonKey.includes('your-supabase')) {
    console.warn('Supabase placeholder values detected. Please replace with actual credentials.');
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return supabaseClient;
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error(`Invalid Supabase URL format: ${supabaseUrl}`);
    supabaseClient = createClient('https://placeholder.supabase.co', 'placeholder-key');
    return supabaseClient;
  }

  // Create and cache the real client
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });

  return supabaseClient;
}

// Export a getter that creates the client lazily
// This prevents the site from crashing if env vars are missing
export const supabase = new Proxy({}, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = client[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});


import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only validate and throw errors at runtime, not during build
// During build, create a client with placeholder values to prevent build failures
// The actual validation will happen when the client is used at runtime
function createSupabaseClient() {
  // During build/static generation, environment variables might not be available
  // Create a client with placeholder values that will fail gracefully at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    // Only use placeholder during actual build phase, not at runtime
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      // Return a client with placeholder values during build only
      // This prevents build failures, but will fail at runtime when actually used
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    // At runtime, throw an error if env vars are missing
    if (typeof window !== 'undefined') {
      console.error('Missing Supabase environment variables.');
      console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
    }
    throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Check if values are still placeholders
  if (supabaseUrl.includes('your-supabase') || supabaseAnonKey.includes('your-supabase')) {
    throw new Error('Please replace the placeholder values in .env.local with your actual Supabase project URL and anon key. Get these from your Supabase project settings.');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}. Please check your NEXT_PUBLIC_SUPABASE_URL in .env.local`);
  }

  // Log in development to help debug
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log('Supabase client initialized with URL:', supabaseUrl);
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

export const supabase = createSupabaseClient();


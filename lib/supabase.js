import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only validate and throw errors at runtime, not during build
// During build, create a client with placeholder values to prevent build failures
// The actual validation will happen when the client is used at runtime
function createSupabaseClient() {
  // During build/static generation, environment variables might not be available
  // Create a client with placeholder values that will fail gracefully at runtime
  if (!supabaseUrl || !supabaseAnonKey) {
    // Check if we're in a build context (Next.js sets this during build)
    if (process.env.NEXT_PHASE === 'phase-production-build' || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      // Return a client with placeholder values during build
      // This prevents build failures, but will fail at runtime when actually used
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
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

  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();


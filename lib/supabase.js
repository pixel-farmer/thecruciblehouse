import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient() {
  // During build phase, use placeholder to prevent build failures
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined' && process.env.NEXT_PHASE === 'phase-production-build') {
      return createClient('https://placeholder.supabase.co', 'placeholder-key');
    }
    
    // At runtime, provide helpful error
    const errorMsg = 'Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your Vercel project settings.';
    if (typeof window !== 'undefined') {
      console.error(errorMsg);
    }
    throw new Error(errorMsg);
  }

  // Check if values are placeholders
  if (supabaseUrl.includes('your-supabase') || supabaseAnonKey.includes('your-supabase')) {
    throw new Error('Please replace the placeholder values with your actual Supabase credentials.');
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
}

// Create client - will throw error at runtime if env vars are missing
// This is better than silently failing with placeholder values
export const supabase = createSupabaseClient();


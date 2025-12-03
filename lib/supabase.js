import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file');
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

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


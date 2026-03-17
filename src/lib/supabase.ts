import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check Vercel settings.');
}

// Initialize Supabase client
// Triggering redeploy to ensure Vercel environment variables are picked up
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

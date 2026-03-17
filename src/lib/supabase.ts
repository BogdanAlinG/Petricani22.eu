import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check Vercel settings.');
}

// Initialize Supabase client
// Only create the client if the URL is valid to prevent app crashes
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http'))
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (() => {
      console.error('Supabase client failed to initialize: Missing or invalid URL.');
      return null as any;
    })();

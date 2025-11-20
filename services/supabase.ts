import { createClient } from '@supabase/supabase-js';

// These should be set in your .env.local file
// For client-side usage, they need to be prefixed with VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client - use empty strings as fallback if not set
// This prevents errors when env vars aren't configured yet
const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);

// Warn if environment variables are missing (but don't break the app)
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables are not set. API calls will fail.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export { supabase };

// Database types for TypeScript
export interface LeaderboardEntry {
  id?: string;
  username: string;
  total_score: number;
  high_score: number;
  updated_at?: string;
  created_at?: string;
}


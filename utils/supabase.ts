import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://umjqyvuchawgoeiwgiok.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVtanF5dnVjaGF3Z29laXdnaW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzE5OTAsImV4cCI6MjA2NjcwNzk5MH0.pq9laV08amghdU8eDTkQzkluI7pwsQXs9Up7nEh8mdI';


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
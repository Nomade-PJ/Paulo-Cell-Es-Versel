import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Uso de variáveis de ambiente do Vite
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não definidas');
}

// Export the supabase client with our enhanced types
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true
  }
});

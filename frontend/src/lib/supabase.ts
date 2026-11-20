import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn('[CronCare] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants — copier .env.example en .env');
}

export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing-key');

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
  console.warn(
    '[CronCare] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY manquants — copier .env.example en .env',
  );
}

/**
 * Client Supabase typé. À n'importer QUE depuis les fichiers `src/features/<nom>/api.ts`
 * (règle ESLint `no-restricted-imports`) : les composants passent par la couche api.
 */
export const supabase = createClient<Database>(url ?? 'http://localhost', anonKey ?? 'missing-key');

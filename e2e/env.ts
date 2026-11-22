// Configuration des tests de bout en bout : tout vient de l'environnement, rien n'est écrit en dur.
// Variables : E2E_ANON_KEY et E2E_SERVICE_ROLE_KEY (valeurs de `supabase status -o env`, base LOCALE
// uniquement), et E2E_SUPABASE_URL si l'API locale n'est pas sur http://127.0.0.1:54321.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:54321';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable ${name} manquante. Lancer Supabase en local (supabase start) puis définir E2E_ANON_KEY et ` +
        `E2E_SERVICE_ROLE_KEY avec les valeurs de « supabase status -o env » (ANON_KEY, SERVICE_ROLE_KEY).`,
    );
  }
  return value;
}

export const anonKey = () => required('E2E_ANON_KEY');

/** Client d'administration : clé service_role de la base LOCALE de test uniquement (jamais celle de production). */
export function adminClient() {
  return createClient(SUPABASE_URL, required('E2E_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

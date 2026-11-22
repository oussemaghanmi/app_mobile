import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Database } from '@/lib/database.types';

/** Colonnes modifiables par l'utilisateur (le GRANT de la migration 0001 exclut `role`). */
export type ProfileUpdate = Partial<
  Pick<
    Database['public']['Tables']['profiles']['Update'],
    'first_name' | 'last_name' | 'language' | 'notif_meds' | 'notif_community' | 'notif_tips'
  >
>;

export async function updateProfile(id: string, fields: ProfileUpdate): Promise<void> {
  unwrap(await supabase.from('profiles').update(fields).eq('id', id));
}

/**
 * Export RGPD : une seule fonction SQL (`export_my_data`, migration 0013) renvoie toutes les données de la
 * personne connectée (14 tables). Une erreur est levée, jamais un export vide silencieux.
 */
export async function exportMyData(): Promise<Record<string, unknown>> {
  return unwrap(await supabase.rpc('export_my_data')) as Record<string, unknown>;
}

/** Supprime le journal privé et le journal des symptômes du patient. */
export async function deleteJournals(profileId: string): Promise<void> {
  unwrap(await supabase.from('private_journal').delete().eq('patient_id', profileId));
  unwrap(await supabase.from('symptom_logs').delete().eq('patient_id', profileId));
}

/** Renvoie `true` si la suppression du compte a réussi. */
export async function deleteMyAccount(): Promise<boolean> {
  const { error } = await supabase.rpc('delete_my_account');
  return !error;
}

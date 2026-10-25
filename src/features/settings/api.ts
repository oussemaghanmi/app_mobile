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

const EXPORT_TABLES = [
  'prescriptions',
  'medication_intakes',
  'mood_logs',
  'symptom_logs',
  'private_journal',
] as const;

/** Export RGPD : toutes les données du patient connecté (RLS : uniquement les siennes). */
export async function exportMyData(profileId: string): Promise<Record<string, unknown>> {
  const dump: Record<string, unknown> = {
    profiles: (await supabase.from('profiles').select('*').eq('id', profileId)).data,
  };
  for (const table of EXPORT_TABLES) {
    dump[table] = (await supabase.from(table).select('*').eq('patient_id', profileId)).data;
  }
  return dump;
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

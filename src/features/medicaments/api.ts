import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';

/** Nombre de jours de prises générés à l'avance (et couverts par les rappels). */
export const INTAKE_HORIZON_DAYS = 7;

/** Crée les prises à venir du patient connecté (idempotent, côté base). Renvoie le nombre créé. */
export async function generateIntakes(days = INTAKE_HORIZON_DAYS): Promise<number> {
  return unwrap(await supabase.rpc('generate_intakes', { p_days: days })) ?? 0;
}

/** Coche une prise comme prise maintenant (RLS : seulement les prises du patient connecté). */
export async function markIntakeTaken(intakeId: string): Promise<void> {
  unwrap(
    await supabase
      .from('medication_intakes')
      .update({ status: 'taken', taken_at: new Date().toISOString() })
      .eq('id', intakeId),
  );
}

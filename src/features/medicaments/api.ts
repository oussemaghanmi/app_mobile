import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Intake, Prescription } from './types';

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

const INTAKE_COLUMNS =
  'id, scheduled_at, taken_at, status, prescription_id, prescriptions(medication, dosage)';

/** Prescriptions actives du patient connecté (lecture seule pour le patient : RLS). */
export async function fetchActivePrescriptions(): Promise<Prescription[]> {
  return (
    unwrap(
      await supabase
        .from('prescriptions')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false }),
    ) ?? []
  );
}

/** Prises du patient connecté entre deux instants (bornes ISO, fin exclue). */
export async function fetchIntakesBetween(from: Date, to: Date): Promise<Intake[]> {
  return (
    unwrap(
      await supabase
        .from('medication_intakes')
        .select(INTAKE_COLUMNS)
        .gte('scheduled_at', from.toISOString())
        .lt('scheduled_at', to.toISOString())
        .order('scheduled_at'),
    ) ?? []
  );
}

/** Observance (%) du mois donné pour le patient connecté. */
export async function fetchAdherence(month = new Date()): Promise<number> {
  return unwrap(await supabase.rpc('monthly_adherence', { p_month: month.toISOString().slice(0, 10) })) ?? 0;
}

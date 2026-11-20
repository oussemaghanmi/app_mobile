import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Appointment } from './types';

/** Rendez-vous visibles (RLS : les siens pour un patient, ceux des patients affectés pour un soignant). */
export async function fetchAppointmentsBetween(
  from: Date,
  to: Date,
  patientId?: string,
): Promise<Appointment[]> {
  let q = supabase
    .from('appointments')
    .select('*')
    .gte('starts_at', from.toISOString())
    .lt('starts_at', to.toISOString())
    .order('starts_at');
  if (patientId) q = q.eq('patient_id', patientId);
  return unwrap(await q) ?? [];
}

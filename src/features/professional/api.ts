import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { AssignedPatient } from './types';

/** Patients affectés au soignant connecté (RLS : `care_assignments` + `profiles`). */
export async function fetchAssignedPatients(professionalId: string): Promise<AssignedPatient[]> {
  const rows = unwrap(
    await supabase
      .from('care_assignments')
      .select('patient:profiles!care_assignments_patient_id_fkey(id, first_name, last_name)')
      .eq('professional_id', professionalId),
  );
  return (rows ?? []).map((r) => r.patient).filter((p): p is AssignedPatient => p !== null);
}

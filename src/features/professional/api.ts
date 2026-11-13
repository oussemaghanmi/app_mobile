import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type {
  Appointment,
  AppointmentInput,
  AssignedPatient,
  MoodLog,
  NursingNote,
  PatientIntake,
  PrescriptionInput,
  PrescriptionWithAuthor,
  SymptomLog,
} from './types';

// Toutes ces lectures sont filtrées par RLS : un soignant n'obtient que ses patients affectés.
// Le journal privé (private_journal) n'est JAMAIS interrogé ici.

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

export async function fetchPatient(id: string): Promise<AssignedPatient | null> {
  return unwrap(
    await supabase.from('profiles').select('id, first_name, last_name').eq('id', id).maybeSingle(),
  );
}

export async function fetchMoods(patientId: string, since: string): Promise<MoodLog[]> {
  return (
    unwrap(
      await supabase
        .from('mood_logs')
        .select('day, mood')
        .eq('patient_id', patientId)
        .gte('day', since)
        .order('day'),
    ) ?? []
  );
}

export async function fetchSymptoms(patientId: string, limit = 20): Promise<SymptomLog[]> {
  return (
    unwrap(
      await supabase
        .from('symptom_logs')
        .select('*')
        .eq('patient_id', patientId)
        .order('logged_at', { ascending: false })
        .limit(limit),
    ) ?? []
  );
}

export async function fetchIntakes(patientId: string, from: Date, to: Date): Promise<PatientIntake[]> {
  return (
    unwrap(
      await supabase
        .from('medication_intakes')
        .select('id, scheduled_at, taken_at, status, prescription_id, prescriptions(medication, dosage)')
        .eq('patient_id', patientId)
        .gte('scheduled_at', from.toISOString())
        .lt('scheduled_at', to.toISOString())
        .order('scheduled_at'),
    ) ?? []
  );
}

export async function fetchPrescriptions(patientId: string): Promise<PrescriptionWithAuthor[]> {
  return (
    unwrap(
      await supabase
        .from('prescriptions')
        .select('*, author:profiles!prescriptions_prescribed_by_fkey(first_name, last_name)')
        .eq('patient_id', patientId)
        .order('active', { ascending: false })
        .order('created_at', { ascending: false }),
    ) ?? []
  );
}

export async function fetchNursingNotes(patientId: string): Promise<NursingNote[]> {
  return (
    unwrap(
      await supabase
        .from('nursing_notes')
        .select('*, author:profiles!nursing_notes_nurse_id_fkey(first_name, last_name)')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false }),
    ) ?? []
  );
}

export async function fetchAppointments(patientId: string, from: Date): Promise<Appointment[]> {
  return (
    unwrap(
      await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .gte('starts_at', from.toISOString())
        .order('starts_at'),
    ) ?? []
  );
}

export async function createAppointment(patientId: string, input: AppointmentInput): Promise<void> {
  unwrap(
    await supabase.from('appointments').insert({
      patient_id: patientId,
      starts_at: new Date(input.starts_at).toISOString(),
      duration_minutes: input.duration_minutes,
      location: input.location.trim() || null,
      notes: input.notes.trim() || null,
    }),
  );
}

export async function deleteAppointment(id: string): Promise<void> {
  unwrap(await supabase.from('appointments').delete().eq('id', id));
}

const toRow = (input: PrescriptionInput) => ({
  medication: input.medication.trim(),
  dosage: input.dosage.trim(),
  times_of_day: [...new Set(input.times_of_day.filter(Boolean))].sort(),
  start_date: input.start_date,
  end_date: input.end_date || null,
});

/** RLS : seul un médecin affecté peut prescrire, en son nom (`prescribed_by = auth.uid()`). */
export async function createPrescription(patientId: string, doctorId: string, input: PrescriptionInput) {
  unwrap(
    await supabase
      .from('prescriptions')
      .insert({ ...toRow(input), patient_id: patientId, prescribed_by: doctorId }),
  );
}

export async function updatePrescription(id: string, input: PrescriptionInput) {
  unwrap(await supabase.from('prescriptions').update(toRow(input)).eq('id', id));
}

/** Arrêt (ou reprise) : on ne supprime jamais une prescription, pour garder l'historique. */
export async function setPrescriptionActive(id: string, active: boolean) {
  unwrap(await supabase.from('prescriptions').update({ active }).eq('id', id));
}

/** RLS : seul un infirmier affecté peut écrire, en son nom. Les observations ne sont pas modifiables. */
export async function createNursingNote(patientId: string, nurseId: string, content: string) {
  unwrap(
    await supabase
      .from('nursing_notes')
      .insert({ patient_id: patientId, nurse_id: nurseId, content: content.trim() }),
  );
}

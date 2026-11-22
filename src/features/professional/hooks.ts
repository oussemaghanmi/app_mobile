import { useAsync } from '@/lib/useAsync';
import { dayKey } from '@/features/medicaments/status';
import * as api from './api';

export function useAssignedPatients(professionalId: string | undefined) {
  return useAsync(
    () => (professionalId ? api.fetchAssignedPatients(professionalId) : Promise.resolve([])),
    [professionalId],
  );
}

const daysAgo = (n: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
};

/** Toutes les données de la fiche patient (30 derniers jours pour l'humeur et l'observance). */
export function usePatientRecord(patientId: string) {
  const since = daysAgo(29);
  const tomorrow = daysAgo(-1);
  return {
    patient: useAsync(() => api.fetchPatient(patientId), [patientId]),
    moods: useAsync(() => api.fetchMoods(patientId, dayKey(since)), [patientId]),
    symptoms: useAsync(() => api.fetchSymptoms(patientId), [patientId]),
    intakes: useAsync(() => api.fetchIntakes(patientId, since, tomorrow), [patientId]),
    prescriptions: useAsync(() => api.fetchPrescriptions(patientId), [patientId]),
    notes: useAsync(() => api.fetchNursingNotes(patientId), [patientId]),
    appointments: useAsync(() => api.fetchAppointments(patientId, daysAgo(0)), [patientId]),
  };
}

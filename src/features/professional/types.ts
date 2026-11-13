import type { Database } from '@/lib/database.types';

type Tables = Database['public']['Tables'];

export interface AssignedPatient {
  id: string;
  first_name: string;
  last_name: string;
}

export type MoodLog = Pick<Tables['mood_logs']['Row'], 'day' | 'mood'>;
export type SymptomLog = Tables['symptom_logs']['Row'];
export type Appointment = Tables['appointments']['Row'];

interface Author {
  first_name: string;
  last_name: string;
}

export type PrescriptionWithAuthor = Tables['prescriptions']['Row'] & { author: Author | null };
export type NursingNote = Tables['nursing_notes']['Row'] & { author: Author | null };

export interface PatientIntake {
  id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: Database['public']['Enums']['intake_status'];
  prescription_id: string;
  prescriptions: { medication: string; dosage: string } | null;
}

export interface AppointmentInput {
  starts_at: string;
  duration_minutes: number;
  location: string;
  notes: string;
}

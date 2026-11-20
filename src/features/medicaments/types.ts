import type { Database } from '@/lib/database.types';

export type Prescription = Database['public']['Tables']['prescriptions']['Row'];
export type IntakeStatus = Database['public']['Enums']['intake_status'];

export interface Intake {
  id: string;
  scheduled_at: string;
  taken_at: string | null;
  status: IntakeStatus;
  prescription_id: string;
  prescriptions: { medication: string; dosage: string } | null;
}

/** Statut affiché : une prise « pending » dont l'heure est passée depuis plus de 2 h est « oubliée ». */
export type DisplayStatus = 'taken' | 'skipped' | 'missed' | 'late' | 'upcoming';

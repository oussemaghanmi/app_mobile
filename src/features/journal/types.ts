import type { Database } from '@/lib/database.types';

export type SymptomLog = Database['public']['Tables']['symptom_logs']['Row'];
export type PrivateEntry = Database['public']['Tables']['private_journal']['Row'];

export interface SymptomInput {
  pain_level: number;
  stools_per_day: number;
  on_period: boolean;
  notes: string;
}

import type { Database } from '@/lib/database.types';

export type IntakeStatus = Database['public']['Enums']['intake_status'];
export type Tip = Database['public']['Tables']['tips']['Row'];

export interface TodayIntake {
  id: string;
  scheduled_at: string;
  status: IntakeStatus;
  prescriptions: { medication: string; dosage: string } | null;
}

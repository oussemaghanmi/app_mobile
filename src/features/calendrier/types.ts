import type { Database } from '@/lib/database.types';

export type Appointment = Database['public']['Tables']['appointments']['Row'];

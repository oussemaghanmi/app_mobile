import type { Database } from '@/lib/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Role = Database['public']['Enums']['app_role'];
export type Language = 'fr' | 'en' | 'ar' | 'tn';

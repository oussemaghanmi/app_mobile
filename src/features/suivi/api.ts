import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Intake } from '@/features/medicaments/types';

// Lecture seule des données déjà saisies par le patient (le RLS ne renvoie que les siennes).

export interface SymptomPoint {
  logged_at: string;
  pain_level: number | null;
  stools_per_day: number | null;
}

export async function fetchSymptomsSince(since: Date): Promise<SymptomPoint[]> {
  return (
    unwrap(
      await supabase
        .from('symptom_logs')
        .select('logged_at, pain_level, stools_per_day')
        .gte('logged_at', since.toISOString())
        .order('logged_at'),
    ) ?? []
  );
}

export async function fetchMoodsSince(day: string): Promise<{ day: string; mood: number }[]> {
  return unwrap(await supabase.from('mood_logs').select('day, mood').gte('day', day).order('day')) ?? [];
}

export async function fetchIntakesSince(since: Date): Promise<Pick<Intake, 'status' | 'scheduled_at'>[]> {
  return (
    unwrap(
      await supabase
        .from('medication_intakes')
        .select('status, scheduled_at')
        .gte('scheduled_at', since.toISOString())
        .lte('scheduled_at', new Date().toISOString()),
    ) ?? []
  );
}

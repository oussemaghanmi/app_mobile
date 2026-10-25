import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Tip, TodayIntake } from './types';

export const today = () => new Date().toISOString().slice(0, 10);

/** Prises prévues aujourd'hui (RLS : seulement celles du patient connecté). */
export async function fetchTodayIntakes(): Promise<TodayIntake[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const rows = unwrap(
    await supabase
      .from('medication_intakes')
      .select('id, scheduled_at, status, prescriptions(medication, dosage)')
      .gte('scheduled_at', start.toISOString())
      .lt('scheduled_at', end.toISOString())
      .order('scheduled_at'),
  );
  return rows ?? [];
}

export async function fetchMonthlyAdherence(): Promise<number | null> {
  return unwrap(await supabase.rpc('monthly_adherence'));
}

export async function fetchTodayMood(): Promise<number | null> {
  const row = unwrap(await supabase.from('mood_logs').select('mood').eq('day', today()).maybeSingle());
  return row?.mood ?? null;
}

export async function saveMood(patientId: string, mood: number): Promise<void> {
  unwrap(await supabase.from('mood_logs').upsert({ patient_id: patientId, day: today(), mood }));
}

export async function fetchTips(): Promise<Tip[]> {
  return unwrap(await supabase.from('tips').select('*')) ?? [];
}

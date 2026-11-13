import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { PrivateEntry, SymptomInput, SymptomLog } from './types';

// ---------- Journal des symptômes (visible par l'équipe soignante affectée) ----------
export async function fetchSymptomLogs(limit = 60): Promise<SymptomLog[]> {
  return (
    unwrap(
      await supabase.from('symptom_logs').select('*').order('logged_at', { ascending: false }).limit(limit),
    ) ?? []
  );
}

export async function addSymptomLog(patientId: string, input: SymptomInput): Promise<void> {
  unwrap(
    await supabase.from('symptom_logs').insert({
      patient_id: patientId,
      pain_level: input.pain_level,
      stools_per_day: input.stools_per_day,
      on_period: input.on_period,
      notes: input.notes.trim() || null,
    }),
  );
}

export async function deleteSymptomLog(id: string): Promise<void> {
  unwrap(await supabase.from('symptom_logs').delete().eq('id', id));
}

// ---------- Journal privé (patient SEUL — RLS : patient_id = auth.uid()) ----------
export async function fetchPrivateEntries(): Promise<PrivateEntry[]> {
  return (
    unwrap(await supabase.from('private_journal').select('*').order('created_at', { ascending: false })) ?? []
  );
}

export async function addPrivateEntry(patientId: string, content: string): Promise<void> {
  unwrap(await supabase.from('private_journal').insert({ patient_id: patientId, content: content.trim() }));
}

export async function deletePrivateEntry(id: string): Promise<void> {
  unwrap(await supabase.from('private_journal').delete().eq('id', id));
}

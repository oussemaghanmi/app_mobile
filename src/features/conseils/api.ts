import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Database } from '@/lib/database.types';

export type Tip = Database['public']['Tables']['tips']['Row'];

export async function fetchTips(): Promise<Tip[]> {
  return unwrap(await supabase.from('tips').select('*').order('category').order('id')) ?? [];
}

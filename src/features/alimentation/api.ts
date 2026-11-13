import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Recipe, Store } from './types';

export async function fetchRecipes(): Promise<Recipe[]> {
  return unwrap(await supabase.from('recipes').select('*').order('prep_minutes')) ?? [];
}

export async function fetchStores(): Promise<Store[]> {
  return unwrap(await supabase.from('stores').select('*').order('city').order('name')) ?? [];
}

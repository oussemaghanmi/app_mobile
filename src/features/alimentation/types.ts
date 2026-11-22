import type { Database } from '@/lib/database.types';
import type { Language } from '@/features/auth/types';

export type Recipe = Database['public']['Tables']['recipes']['Row'];
export type Store = Database['public']['Tables']['stores']['Row'];
export type RecipePhase = Database['public']['Enums']['recipe_phase'];

type Localized = 'title' | 'summary' | 'ingredients' | 'steps';

/** Champ traduit d'une recette (repli sur le français). */
export const localized = (r: Recipe, field: Localized, lang: string): string =>
  (r[`${field}_${lang as Language}` as keyof Recipe] as string | undefined) || r[`${field}_fr`];

/** Découpe un champ multi-lignes (ingrédients, étapes) en éléments. */
export const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

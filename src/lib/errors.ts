/** Erreur applicative renvoyée par la couche `api.ts` (message technique, jamais affiché tel quel). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface SupabaseResult<T> {
  data: T;
  error: { message: string; code?: string } | null;
}

/** Transforme une réponse Supabase `{ data, error }` en valeur ou en `ApiError` levée. */
export function unwrap<T>({ data, error }: SupabaseResult<T>): T {
  if (error) throw new ApiError(error.message, error.code);
  return data;
}

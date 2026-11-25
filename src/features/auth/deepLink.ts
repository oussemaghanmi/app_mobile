/**
 * Lien de réinitialisation du mot de passe ouvert dans l'application Android (#88, ADR-0009).
 * Le schéma est l'identifiant de l'application (capacitor.config.ts : appId), ce qui évite toute
 * collision avec une autre application. Il est déclaré dans AndroidManifest.xml et autorisé dans
 * Supabase (additional_redirect_urls).
 */
export const APP_SCHEME = 'tn.croncare.app';
export const APP_RESET_URL = `${APP_SCHEME}://reset-password`;

export type RecoveryLink =
  | { kind: 'tokens'; accessToken: string; refreshToken: string }
  | { kind: 'code'; code: string }
  /** Lien expiré ou refusé : le fragment est transmis tel quel à l'écran, qui l'affiche déjà. */
  | { kind: 'error'; fragment: string };

/** Lit un lien `tn.croncare.app://reset-password…` ; renvoie null pour tout autre lien. */
export function parseRecoveryLink(url: string): RecoveryLink | null {
  if (!url.startsWith(`${APP_RESET_URL}`)) return null;
  const rest = url.slice(APP_RESET_URL.length);
  if (rest && !/^[?#/]/.test(rest)) return null;
  const hashIndex = rest.indexOf('#');
  const fragment = hashIndex >= 0 ? rest.slice(hashIndex + 1) : '';
  const query = rest.slice(rest.indexOf('?') + 1, hashIndex >= 0 ? hashIndex : undefined);
  const hash = new URLSearchParams(fragment);
  const search = new URLSearchParams(rest.includes('?') ? query : '');

  if (hash.get('error') || search.get('error')) return { kind: 'error', fragment: fragment || query };
  const accessToken = hash.get('access_token');
  const refreshToken = hash.get('refresh_token');
  if (accessToken && refreshToken) return { kind: 'tokens', accessToken, refreshToken };
  const code = search.get('code');
  if (code) return { kind: 'code', code };
  return null;
}

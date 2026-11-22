import type { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { unwrap } from '@/lib/errors';
import type { Profile } from './types';

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** S'abonne aux changements de session ; renvoie la fonction de désabonnement. */
export function onSessionChange(cb: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(session));
  return () => data.subscription.unsubscribe();
}

/** S'abonne à tous les événements d'authentification (ex: PASSWORD_RECOVERY). */
export function onAuthStateChange(
  cb: (event: string, session: Session | null) => void,
): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => cb(event, session));
  return () => data.subscription.unsubscribe();
}

/** Profil (et donc rôle) de l'utilisateur connecté — filtré par RLS. */
export async function fetchProfile(uid: string): Promise<Profile | null> {
  return unwrap(await supabase.from('profiles').select('*').eq('id', uid).maybeSingle());
}

/** Renvoie `true` si la connexion a réussi. */
export async function signIn(email: string, password: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return !error;
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

/** Résultat d'une opération d'authentification ; `errorKey` est une clé i18n (jamais le message brut de Supabase). */
export type AuthResult = {
  success: boolean;
  hasSession?: boolean;
  errorKey?: string;
};

/** Traduit une erreur Supabase Auth ou un code d'erreur en clé i18n (les messages bruts sont en anglais). */
export function authErrorKey(
  error: Pick<AuthError, 'name' | 'code'> | { name?: string; code?: string } | string,
): string {
  if (typeof error === 'string') {
    const code = error.toLowerCase();
    if (
      code === 'otp_expired' ||
      code === 'access_denied' ||
      code.includes('expired') ||
      code.includes('invalid')
    ) {
      return 'auth.errors.linkExpired';
    }
    if (code === 'user_already_exists' || code === 'email_exists') {
      return 'auth.errors.alreadyRegistered';
    }
    if (code === 'weak_password') {
      return 'auth.passwordTooShort';
    }
    if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
      return 'auth.errors.rateLimited';
    }
    return 'auth.genericError';
  }

  if (error.name === 'AuthSessionMissingError') return 'auth.errors.linkExpired';
  switch (error.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'auth.errors.alreadyRegistered';
    case 'weak_password':
      return 'auth.passwordTooShort';
    case 'validation_failed':
    case 'email_address_invalid':
      return 'auth.errors.invalidEmail';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'auth.errors.rateLimited';
    case 'otp_expired':
    case 'access_denied':
    case 'session_not_found':
    case 'bad_jwt':
    case 'token_expired':
      return 'auth.errors.linkExpired';
    default:
      return 'auth.genericError';
  }
}

/** Inscription d'un nouveau patient (le trigger DB crée automatiquement le profil patient). */
export async function signUp(
  email: string,
  password: string,
  firstName: string,
): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName },
    },
  });
  if (error) {
    return { success: false, errorKey: authErrorKey(error) };
  }
  return { success: true, hasSession: !!data?.session };
}

/**
 * Calcule l'URL de redirection pour le mot de passe oublié.
 * En environnement mobile (Capacitor/Android), window.location.origin est 'http://localhost'
 * ce qui n'est pas atteignable depuis le client mail d'un smartphone.
 * Une variable d'environnement VITE_SITE_URL (ou deep link) permet de surcharger l'URL pour la production mobile.
 */
export function getResetPasswordRedirectUrl(): string {
  const customSiteUrl = import.meta.env.VITE_SITE_URL as string | undefined;
  if (customSiteUrl) {
    return `${customSiteUrl.replace(/\/+$/, '')}/reset-password`;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/reset-password`;
  }
  return 'http://localhost:5173/reset-password';
}

/** Demande de réinitialisation de mot de passe envoyée par e-mail. */
export async function resetPasswordForEmail(
  email: string,
  redirectTo = getResetPasswordRedirectUrl(),
): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) {
    return { success: false, errorKey: authErrorKey(error) };
  }
  return { success: true };
}

/** Mise à jour du mot de passe (suite à l'ouverture du lien de récupération). */
export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, errorKey: authErrorKey(error) };
  }
  return { success: true };
}

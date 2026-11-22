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
export type AuthResult = { success: boolean; errorKey?: string };

/** Traduit une erreur Supabase Auth en clé i18n (les messages bruts sont en anglais). */
export function authErrorKey(error: Pick<AuthError, 'name' | 'code'>): string {
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
    default:
      return 'auth.genericError';
  }
}

/** Inscription d'un nouveau patient (le trigger DB crée automatiquement le profil patient). */
export async function signUp(email: string, password: string, firstName: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName },
    },
  });
  if (error) {
    return { success: false, errorKey: authErrorKey(error) };
  }
  return { success: true };
}

/** Demande de réinitialisation de mot de passe envoyée par e-mail. */
export async function resetPasswordForEmail(email: string, redirectTo?: string): Promise<AuthResult> {
  const target =
    redirectTo ?? (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: target,
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

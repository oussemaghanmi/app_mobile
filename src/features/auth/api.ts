import type { Session } from '@supabase/supabase-js';
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

/** Inscription d'un nouveau patient (le trigger DB crée automatiquement le profil patient). */
export async function signUp(
  email: string,
  password: string,
  firstName: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName },
    },
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Demande de réinitialisation de mot de passe envoyée par e-mail. */
export async function resetPasswordForEmail(
  email: string,
  redirectTo?: string,
): Promise<{ success: boolean; error?: string }> {
  const target =
    redirectTo ??
    (typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined);
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: target,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/** Mise à jour du mot de passe (suite à l'ouverture du lien de récupération). */
export async function updatePassword(
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

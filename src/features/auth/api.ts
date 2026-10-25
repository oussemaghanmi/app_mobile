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

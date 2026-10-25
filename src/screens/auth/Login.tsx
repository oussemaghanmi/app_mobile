import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import { homePathFor } from '@/auth/permissions';

export default function Login() {
  const { t } = useTranslation();
  const { session, profile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session && profile) return <Navigate to={homePathFor(profile.role)} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setError(!!error);
    setBusy(false);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-3xl text-sage-dark">{t('app')}</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-3">
        <h2 className="text-xl">{t('login.title')}</h2>
        <input className="input" type="email" autoComplete="email" placeholder={t('login.email')}
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="input" type="password" autoComplete="current-password" placeholder={t('login.password')}
          value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <p className="text-sm text-terracotta">{t('login.error')}</p>}
        <button className="btn" disabled={busy}>{t('login.submit')}</button>
      </form>
    </main>
  );
}

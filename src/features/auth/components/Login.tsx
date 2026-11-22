import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthProvider';
import { homePathFor } from '../permissions';
import { signIn } from '../api';
import { Logo } from '@/components/ui/Logo';

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
    setError(!(await signIn(email, password)));
    setBusy(false);
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <header className="flex flex-col items-center gap-2 text-center">
        <Logo className="h-20 w-20 drop-shadow-sm" />
        <h1 className="text-3xl text-sage-dark">{t('app')}</h1>
        <p className="text-ink/70">{t('login.tagline')}</p>
      </header>
      <form onSubmit={onSubmit} className="card flex flex-col gap-3">
        <h2 className="text-xl">{t('login.title')}</h2>
        <label htmlFor="login-email" className="text-sm font-medium">
          {t('login.email')}
        </label>
        <input
          id="login-email"
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="login-password" className="text-sm font-medium">
          {t('login.password')}
        </label>
        <input
          id="login-password"
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-terracotta-dark">
            {t('login.error')}
          </p>
        )}
        <button className="btn" disabled={busy}>
          {t('login.submit')}
        </button>
      </form>
    </main>
  );
}

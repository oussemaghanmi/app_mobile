import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthProvider';
import { homePathFor } from '../permissions';
import { signIn } from '../api';

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
      <h1 className="text-center text-3xl text-sage-dark">{t('app')}</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-3">
        <h2 className="text-xl">{t('login.title')}</h2>
        <input
          className="input"
          type="email"
          autoComplete="email"
          placeholder={t('login.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          placeholder={t('login.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-terracotta">
            {t('login.error')}
          </p>
        )}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-xs text-sage-dark underline min-h-[44px] flex items-center"
          >
            {t('auth.forgotPasswordLink')}
          </Link>
        </div>
        <button className="btn min-h-11" disabled={busy}>
          {t('login.submit')}
        </button>
        <div className="mt-2 text-center">
          <Link
            to="/signup"
            className="text-sm text-sage-dark underline min-h-[44px] inline-flex items-center justify-center"
          >
            {t('auth.noAccount')}
          </Link>
        </div>
      </form>
    </main>
  );
}

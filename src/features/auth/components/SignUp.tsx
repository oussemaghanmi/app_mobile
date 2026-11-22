import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthProvider';
import { homePathFor } from '../permissions';
import { signUp } from '../api';

export default function SignUp() {
  const { t } = useTranslation();
  const { session, profile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  if (session && profile) return <Navigate to={homePathFor(profile.role)} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg(t('auth.passwordTooShort'));
      return;
    }

    setBusy(true);
    try {
      const res = await signUp(email, password, firstName);
      if (!res.success) {
        setErrorMsg(res.error || t('auth.genericError'));
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMsg(t('auth.genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-3xl text-sage-dark">{t('app')}</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-3">
        <h2 className="text-xl">{t('auth.signupTitle')}</h2>

        {success ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="rounded-xl bg-sage/15 p-3 text-sm text-sage-dark">
              {t('auth.signupSuccess')}
            </p>
            <Link to="/login" className="btn min-h-11 flex items-center justify-center text-center">
              {t('login.submit')}
            </Link>
          </div>
        ) : (
          <>
            <label className="text-sm flex flex-col gap-1">
              <span>{t('auth.firstName')}</span>
              <input
                className="input min-h-11"
                type="text"
                autoComplete="given-name"
                placeholder={t('auth.firstName')}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </label>

            <label className="text-sm flex flex-col gap-1">
              <span>{t('login.email')}</span>
              <input
                className="input min-h-11"
                type="email"
                autoComplete="email"
                placeholder={t('login.email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="text-sm flex flex-col gap-1">
              <span>{t('login.password')}</span>
              <input
                className="input min-h-11"
                type="password"
                autoComplete="new-password"
                placeholder={t('login.password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="text-xs text-ink/70">{t('auth.passwordRules')}</span>
            </label>

            {errorMsg && (
              <p role="alert" className="text-sm text-terracotta-dark">
                {errorMsg}
              </p>
            )}

            <button className="btn min-h-11" disabled={busy}>
              {t('auth.createAccount')}
            </button>

            <div className="mt-2 text-center">
              <Link
                to="/login"
                className="text-sm text-sage-dark underline min-h-[44px] inline-flex items-center justify-center"
              >
                {t('auth.alreadyHaveAccount')}
              </Link>
            </div>
          </>
        )}
      </form>
    </main>
  );
}

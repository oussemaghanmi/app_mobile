import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authErrorKey, getSession, onAuthStateChange, updatePassword } from '../api';

function parseAuthUrlError(): string | null {
  if (typeof window === 'undefined') return null;

  const hash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const searchParams = new URLSearchParams(window.location.search);

  const errorCode = hashParams.get('error_code') || searchParams.get('error_code');
  const errorDescription =
    hashParams.get('error_description') || searchParams.get('error_description');
  const error = hashParams.get('error') || searchParams.get('error');

  return errorCode || errorDescription || error;
}

export default function ResetPassword() {
  const { t } = useTranslation();
  const [urlError] = useState<string | null>(parseAuthUrlError);
  const [noSession, setNoSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(() =>
    urlError ? t(authErrorKey(urlError)) : null,
  );
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (urlError) return;

    let isMounted = true;

    getSession()
      .then((session) => {
        if (!isMounted) return;
        if (!session) {
          setNoSession(true);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setNoSession(true);
      });

    const unsubscribe = onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'PASSWORD_RECOVERY' || session) {
        setNoSession(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [urlError]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg(t('auth.passwordTooShort'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordsDoNotMatch'));
      return;
    }

    setBusy(true);
    try {
      const res = await updatePassword(password);
      if (!res.success) {
        setErrorMsg(t(res.errorKey ?? 'auth.genericError'));
      } else {
        setSuccess(true);
      }
    } catch {
      setErrorMsg(t('auth.genericError'));
    } finally {
      setBusy(false);
    }
  };

  const isLinkInvalid = Boolean(urlError);

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-3xl text-sage-dark">{t('app')}</h1>
      <div className="card flex flex-col gap-3">
        <h2 className="text-xl">{t('auth.resetPasswordTitle')}</h2>

        {isLinkInvalid || noSession ? (
          <div className="flex flex-col gap-4">
            <p role="alert" className="text-sm text-terracotta-dark">
              {errorMsg || t('auth.errors.noRecoverySession')}
            </p>
            <Link
              to="/forgot-password"
              className="btn min-h-11 flex items-center justify-center text-center"
            >
              {t('auth.requestNewLink')}
            </Link>
            <div className="mt-2 text-center">
              <Link
                to="/login"
                className="text-sm text-sage-dark underline min-h-[44px] inline-flex items-center justify-center"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="rounded-xl bg-sage/15 p-3 text-sm text-sage-dark">
              {t('auth.passwordChanged')}
            </p>
            <Link to="/login" className="btn min-h-11 flex items-center justify-center text-center">
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <label className="text-sm flex flex-col gap-1">
              <span>{t('auth.newPassword')}</span>
              <input
                className="input min-h-11"
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.newPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span className="text-xs text-ink/70">{t('auth.passwordRules')}</span>
            </label>

            <label className="text-sm flex flex-col gap-1">
              <span>{t('auth.confirmNewPassword')}</span>
              <input
                className="input min-h-11"
                type="password"
                autoComplete="new-password"
                placeholder={t('auth.confirmNewPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </label>

            {errorMsg && (
              <p role="alert" className="text-sm text-terracotta-dark">
                {errorMsg}
              </p>
            )}

            <button className="btn min-h-11" disabled={busy}>
              {t('auth.changePassword')}
            </button>

            <div className="mt-2 text-center">
              <Link
                to="/login"
                className="text-sm text-sage-dark underline min-h-[44px] inline-flex items-center justify-center"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

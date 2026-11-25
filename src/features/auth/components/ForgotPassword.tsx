import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordForEmail } from '../api';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setBusy(true);

    try {
      const res = await resetPasswordForEmail(email);
      if (!res.success) {
        setErrorMsg(t(res.errorKey ?? 'auth.genericError'));
      } else {
        setSent(true);
      }
    } catch {
      setErrorMsg(t('auth.genericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-full max-w-sm flex-col justify-center gap-6 p-6">
      <LanguageSwitcher />
      <h1 className="text-center text-3xl text-sage-dark">{t('app')}</h1>
      <form onSubmit={onSubmit} className="card flex flex-col gap-3">
        <h2 className="text-xl">{t('auth.forgotPasswordTitle')}</h2>

        {sent ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="rounded-xl bg-sage/15 p-3 text-sm text-sage-dark">
              {t('auth.resetLinkSent')}
            </p>
            <Link to="/login" className="btn min-h-11 flex items-center justify-center text-center">
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-ink/70">{t('auth.forgotPasswordInstructions')}</p>

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

            {errorMsg && (
              <p role="alert" className="text-sm text-terracotta-dark">
                {errorMsg}
              </p>
            )}

            <button className="btn min-h-11" disabled={busy}>
              {t('auth.sendResetLink')}
            </button>

            <div className="mt-2 text-center">
              <Link
                to="/login"
                className="text-sm text-sage-dark underline min-h-[44px] inline-flex items-center justify-center"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          </>
        )}
      </form>
    </main>
  );
}

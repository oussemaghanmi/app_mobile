import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { updatePassword } from '../api';

export default function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

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
        <h2 className="text-xl">{t('auth.resetPasswordTitle')}</h2>

        {success ? (
          <div className="flex flex-col gap-4">
            <p role="status" className="rounded-xl bg-sage/15 p-3 text-sm text-sage-dark">
              {t('auth.passwordChanged')}
            </p>
            <Link to="/login" className="btn min-h-11 flex items-center justify-center text-center">
              {t('auth.backToLogin')}
            </Link>
          </div>
        ) : (
          <>
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
          </>
        )}
      </form>
    </main>
  );
}

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { createPseudonym } from '../api';

/** Choix du pseudonyme avant la première participation (le nom réel n'est jamais affiché). */
export function PseudonymSetup({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await createPseudonym(value);
      if (res === 'ok') onDone();
      else setError(t(`community.pseudonym.${res}`));
    } catch {
      setError(t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3">
      <h2 className="text-lg">{t('community.pseudonym.title')}</h2>
      <p className="text-sm text-ink/70">{t('community.pseudonym.explain')}</p>
      <label className="text-sm font-medium">
        {t('community.pseudonym.label')}
        <input
          className="input mt-1 min-h-11"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          minLength={3}
          maxLength={30}
          pattern="[\p{L}\p{N}_.\- ]{3,30}"
          required
          aria-describedby="pseudo-hint"
        />
      </label>
      <p id="pseudo-hint" className="text-xs text-ink/60">
        {t('community.pseudonym.hint')}
      </p>
      {error && (
        <p role="alert" className="text-sm text-terracotta">
          {error}
        </p>
      )}
      <button className="btn min-h-11" disabled={busy}>
        {t('community.pseudonym.submit')}
      </button>
    </form>
  );
}

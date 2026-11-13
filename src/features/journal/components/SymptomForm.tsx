import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { SymptomInput } from '../types';

const EMPTY: SymptomInput = { pain_level: 0, stools_per_day: 0, on_period: false, notes: '' };

/** Saisie du jour : douleur 0–10, nombre de selles, jour de règles, notes. */
export function SymptomForm({ onSubmit }: { onSubmit: (input: SymptomInput) => Promise<void> }) {
  const { t } = useTranslation();
  const [value, setValue] = useState<SymptomInput>(EMPTY);
  const [status, setStatus] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const set = <K extends keyof SymptomInput>(k: K, v: SymptomInput[K]) => setValue((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('busy');
    try {
      await onSubmit(value);
      setValue(EMPTY);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4">
      <h2 className="text-lg">{t('journal.symptoms.newEntry')}</h2>

      <label className="flex flex-col gap-1 text-sm font-medium">
        <span className="flex justify-between">
          {t('journal.symptoms.pain')}
          <output className="text-lg font-bold text-terracotta">{value.pain_level}/10</output>
        </span>
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value.pain_level}
          onChange={(e) => set('pain_level', Number(e.target.value))}
          className="h-11 w-full accent-terracotta"
          aria-valuetext={t('journal.symptoms.painValue', { value: value.pain_level })}
        />
        <span className="flex justify-between text-xs font-normal text-ink/60">
          <span>{t('journal.symptoms.painNone')}</span>
          <span>{t('journal.symptoms.painMax')}</span>
        </span>
      </label>

      <div className="flex items-center justify-between">
        <span id="stools-label" className="text-sm font-medium">
          {t('journal.symptoms.stools')}
        </span>
        <div role="group" aria-labelledby="stools-label" className="flex items-center gap-2">
          <button
            type="button"
            className="h-11 w-11 rounded-full bg-sage/15 text-xl text-sage-dark"
            aria-label={t('journal.symptoms.less')}
            onClick={() => set('stools_per_day', Math.max(0, value.stools_per_day - 1))}
          >
            −
          </button>
          <output aria-live="polite" className="w-8 text-center text-lg font-bold">
            {value.stools_per_day}
          </output>
          <button
            type="button"
            className="h-11 w-11 rounded-full bg-sage/15 text-xl text-sage-dark"
            aria-label={t('journal.symptoms.more')}
            onClick={() => set('stools_per_day', Math.min(50, value.stools_per_day + 1))}
          >
            +
          </button>
        </div>
      </div>

      <label className="flex min-h-11 items-center justify-between text-sm font-medium">
        {t('journal.symptoms.period')}
        <input
          type="checkbox"
          className="h-6 w-6 accent-sage"
          checked={value.on_period}
          onChange={(e) => set('on_period', e.target.checked)}
        />
      </label>

      <label className="text-sm font-medium">
        {t('journal.symptoms.notes')}
        <textarea
          className="input mt-1"
          rows={3}
          maxLength={2000}
          value={value.notes}
          onChange={(e) => set('notes', e.target.value)}
          placeholder={t('journal.symptoms.notesPlaceholder')}
        />
      </label>

      {status === 'saved' && (
        <p role="status" className="text-sm text-sage-dark">
          {t('journal.saved')}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm text-terracotta">
          {t('common.error')}
        </p>
      )}
      <button className="btn min-h-11" disabled={status === 'busy'}>
        {t('settings.save')}
      </button>
    </form>
  );
}

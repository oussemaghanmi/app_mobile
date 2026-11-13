import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { AppointmentInput } from '../types';

const EMPTY: AppointmentInput = { starts_at: '', duration_minutes: 30, location: '', notes: '' };

/** Création d'un rendez-vous par le soignant affecté. */
export function AppointmentForm({ onSubmit }: { onSubmit: (input: AppointmentInput) => Promise<void> }) {
  const { t } = useTranslation();
  const [value, setValue] = useState(EMPTY);
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const set = <K extends keyof AppointmentInput>(k: K, v: AppointmentInput[K]) =>
    setValue((s) => ({ ...s, [k]: v }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('busy');
    try {
      await onSubmit(value);
      setValue(EMPTY);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 rounded-xl bg-cream p-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          {t('pro.appointments.when')}
          <input
            type="datetime-local"
            required
            className="input mt-1 min-h-11"
            value={value.starts_at}
            onChange={(e) => set('starts_at', e.target.value)}
          />
        </label>
        <label className="text-sm">
          {t('pro.appointments.duration')}
          <input
            type="number"
            min={5}
            max={480}
            step={5}
            required
            className="input mt-1 min-h-11"
            value={value.duration_minutes}
            onChange={(e) => set('duration_minutes', Number(e.target.value))}
          />
        </label>
      </div>
      <label className="text-sm">
        {t('pro.appointments.location')}
        <input
          className="input mt-1 min-h-11"
          maxLength={200}
          value={value.location}
          onChange={(e) => set('location', e.target.value)}
        />
      </label>
      <label className="text-sm">
        {t('journal.symptoms.notes')}
        <textarea
          className="input mt-1"
          rows={2}
          maxLength={1000}
          value={value.notes}
          onChange={(e) => set('notes', e.target.value)}
        />
      </label>
      {status === 'error' && (
        <p role="alert" className="text-sm text-terracotta">
          {t('common.error')}
        </p>
      )}
      <button className="btn min-h-11" disabled={status === 'busy'}>
        {t('pro.appointments.add')}
      </button>
    </form>
  );
}

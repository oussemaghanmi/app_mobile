import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { PrescriptionInput } from '../types';

const today = () => new Date().toISOString().slice(0, 10);
const emptyPrescription = (): PrescriptionInput => ({
  medication: '',
  dosage: '',
  times_of_day: ['08:00'],
  start_date: today(),
  end_date: '',
});

interface Props {
  initial?: PrescriptionInput;
  onSubmit: (input: PrescriptionInput) => Promise<void>;
  onCancel: () => void;
}

/** Formulaire de prescription (médecin) : médicament, dosage, horaires multiples, dates. */
export function PrescriptionForm({ initial, onSubmit, onCancel }: Props) {
  const { t } = useTranslation();
  const [value, setValue] = useState<PrescriptionInput>(initial ?? emptyPrescription());
  const [status, setStatus] = useState<'idle' | 'busy' | 'error' | 'dates'>('idle');
  const set = <K extends keyof PrescriptionInput>(k: K, v: PrescriptionInput[K]) =>
    setValue((s) => ({ ...s, [k]: v }));
  const setTime = (i: number, v: string) =>
    set(
      'times_of_day',
      value.times_of_day.map((x, j) => (j === i ? v : x)),
    );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (value.end_date && value.end_date < value.start_date) return setStatus('dates');
    setStatus('busy');
    try {
      await onSubmit(value);
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 rounded-xl bg-cream p-3">
      <label className="text-sm">
        {t('pro.rx.medication')}
        <input
          required
          maxLength={120}
          className="input mt-1 min-h-11"
          value={value.medication}
          onChange={(e) => set('medication', e.target.value)}
        />
      </label>
      <label className="text-sm">
        {t('pro.rx.dosage')}
        <input
          required
          maxLength={120}
          className="input mt-1 min-h-11"
          placeholder={t('pro.rx.dosagePlaceholder')}
          value={value.dosage}
          onChange={(e) => set('dosage', e.target.value)}
        />
      </label>
      <fieldset className="text-sm">
        <legend>{t('pro.rx.times')}</legend>
        <div className="mt-1 flex flex-wrap gap-2">
          {value.times_of_day.map((time, i) => (
            <div key={i} className="flex items-center gap-1">
              <input
                type="time"
                required
                aria-label={t('pro.rx.timeN', { n: i + 1 })}
                className="input min-h-11 w-28"
                value={time}
                onChange={(e) => setTime(i, e.target.value)}
              />
              {value.times_of_day.length > 1 && (
                <button
                  type="button"
                  className="h-11 w-11 rounded-full text-terracotta"
                  aria-label={t('pro.rx.removeTime', { n: i + 1 })}
                  onClick={() =>
                    set(
                      'times_of_day',
                      value.times_of_day.filter((_, j) => j !== i),
                    )
                  }
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {value.times_of_day.length < 8 && (
            <button
              type="button"
              className="min-h-11 rounded-full border border-sage px-3 text-sage-dark"
              onClick={() => set('times_of_day', [...value.times_of_day, '12:00'])}
            >
              + {t('pro.rx.addTime')}
            </button>
          )}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">
          {t('pro.rx.start')}
          <input
            type="date"
            required
            className="input mt-1 min-h-11"
            value={value.start_date}
            onChange={(e) => set('start_date', e.target.value)}
          />
        </label>
        <label className="text-sm">
          {t('pro.rx.end')}
          <input
            type="date"
            className="input mt-1 min-h-11"
            value={value.end_date}
            min={value.start_date}
            onChange={(e) => set('end_date', e.target.value)}
          />
        </label>
      </div>
      {status === 'dates' && (
        <p role="alert" className="text-sm text-terracotta">
          {t('pro.rx.datesError')}
        </p>
      )}
      {status === 'error' && (
        <p role="alert" className="text-sm text-terracotta">
          {t('common.error')}
        </p>
      )}
      <div className="flex gap-2">
        <button className="btn min-h-11 flex-1" disabled={status === 'busy'}>
          {t('settings.save')}
        </button>
        <button type="button" className="btn-danger min-h-11" onClick={onCancel}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

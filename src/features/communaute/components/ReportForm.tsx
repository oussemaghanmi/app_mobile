import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { report } from '../api';
import { REPORT_REASONS, type ReportReason, type ReportTarget } from '../types';

/** Formulaire de signalement (motif + précision facultative). */
export function ReportForm({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason>('medical_misinformation');
  const [details, setDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'ok' | 'already' | 'error'>('idle');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('busy');
    try {
      setStatus(await report(target, reason, details));
    } catch {
      setStatus('error');
    }
  };

  if (status === 'ok' || status === 'already') {
    return (
      <div role="status" className="mt-2 rounded-xl bg-sage/10 p-3 text-sm">
        {t(status === 'ok' ? 'community.report.thanks' : 'community.report.already')}
        <button className="ms-2 min-h-11 underline" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-2 flex flex-col gap-2 rounded-xl border border-terracotta/30 p-3">
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-sm font-medium">{t('community.report.why')}</legend>
        {REPORT_REASONS.map((r) => (
          <label key={r} className="flex min-h-11 items-center gap-2 text-sm">
            <input
              type="radio"
              name="reason"
              value={r}
              checked={reason === r}
              onChange={() => setReason(r)}
              className="h-5 w-5 accent-terracotta"
            />
            {t(`community.report.reasons.${r}`)}
          </label>
        ))}
      </fieldset>
      <label className="text-sm">
        {t('community.report.details')}
        <textarea
          className="input mt-1"
          rows={2}
          maxLength={500}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </label>
      {status === 'error' && (
        <p role="alert" className="text-sm text-terracotta">
          {t('common.error')}
        </p>
      )}
      <div className="flex gap-2">
        <button className="btn min-h-11 flex-1 bg-terracotta" disabled={status === 'busy'}>
          {t('community.report.submit')}
        </button>
        <button type="button" className="btn-danger min-h-11" onClick={onClose}>
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}

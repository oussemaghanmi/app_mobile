import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AsyncView } from '@/components/AsyncView';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/features/auth/permissions';
import type { AsyncState } from '@/lib/useAsync';
import * as api from '../api';
import type { PrescriptionWithAuthor } from '../types';
import { PrescriptionForm } from './PrescriptionForm';

interface Props {
  patientId: string;
  state: AsyncState<PrescriptionWithAuthor[]>;
  fmtDate: (iso: string) => string;
}

/**
 * Prescriptions du patient. Le médecin (permission `prescriptions:write`) peut créer, modifier,
 * arrêter et reprendre ; l'infirmier les consulte. La barrière réelle reste le RLS (médecin affecté).
 */
export function PrescriptionsSection({ patientId, state, fmtDate }: Props) {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [editing, setEditing] = useState<'new' | string | null>(null);
  const canWrite = can(profile?.role, 'prescriptions:write');
  const author = (rx: PrescriptionWithAuthor) =>
    rx.author ? `${rx.author.first_name} ${rx.author.last_name}`.trim() : '—';

  const toggle = async (rx: PrescriptionWithAuthor) => {
    if (rx.active && !confirm(t('pro.rx.confirmStop', { name: rx.medication }))) return;
    await api.setPrescriptionActive(rx.id, !rx.active);
    state.reload();
  };

  return (
    <section className="card" aria-labelledby="rx-title">
      <div className="flex items-center justify-between">
        <h2 id="rx-title" className="text-lg">
          {t('pro.prescriptions')}
        </h2>
        {canWrite && editing !== 'new' && (
          <button
            className="min-h-11 px-2 text-sm font-medium text-sage-dark underline"
            onClick={() => setEditing('new')}
          >
            + {t('pro.rx.new')}
          </button>
        )}
      </div>
      {canWrite && editing === 'new' && profile && (
        <PrescriptionForm
          onCancel={() => setEditing(null)}
          onSubmit={async (input) => {
            await api.createPrescription(patientId, profile.id, input);
            setEditing(null);
            state.reload();
          }}
        />
      )}
      <AsyncView state={state} isEmpty={(l) => l.length === 0} empty={t('meds.noPrescription')}>
        {(list) => (
          <ul className="mt-2 flex flex-col gap-2">
            {list.map((rx) => (
              <li
                key={rx.id}
                className={`rounded-xl border p-3 ${rx.active ? 'border-sage/40' : 'border-black/5 bg-ink/5'}`}
              >
                <p className="font-medium">
                  {rx.medication} — {rx.dosage}
                  {!rx.active && <span className="ms-2 text-xs text-ink/60">({t('pro.rx.inactive')})</span>}
                </p>
                <p className="text-sm text-ink/70">
                  {rx.times_of_day.map((h) => h.slice(0, 5)).join(' · ')} ·{' '}
                  {rx.end_date
                    ? t('meds.fromTo', { from: fmtDate(rx.start_date), to: fmtDate(rx.end_date) })
                    : t('meds.since', { from: fmtDate(rx.start_date) })}
                </p>
                <p className="text-xs text-ink/60">{t('pro.rx.by', { name: author(rx) })}</p>
                {canWrite && editing !== rx.id && (
                  <div className="mt-1 flex gap-2 text-sm">
                    {rx.active && (
                      <button
                        className="min-h-11 px-2 text-sage-dark underline"
                        onClick={() => setEditing(rx.id)}
                      >
                        {t('pro.rx.edit')}
                      </button>
                    )}
                    <button
                      className={`min-h-11 px-2 underline ${rx.active ? 'text-terracotta' : 'text-sage-dark'}`}
                      onClick={() => toggle(rx)}
                    >
                      {rx.active ? t('pro.rx.stop') : t('pro.rx.resume')}
                    </button>
                  </div>
                )}
                {canWrite && editing === rx.id && (
                  <PrescriptionForm
                    initial={{
                      medication: rx.medication,
                      dosage: rx.dosage,
                      times_of_day: rx.times_of_day.map((h) => h.slice(0, 5)),
                      start_date: rx.start_date,
                      end_date: rx.end_date ?? '',
                    }}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (input) => {
                      await api.updatePrescription(rx.id, input);
                      setEditing(null);
                      state.reload();
                    }}
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </AsyncView>
      {canWrite && <p className="mt-2 text-xs text-ink/60">{t('pro.rx.regenerateNote')}</p>}
    </section>
  );
}

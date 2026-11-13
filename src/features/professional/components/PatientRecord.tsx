import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { AsyncView } from '@/components/AsyncView';
import { useAuth } from '@/features/auth/AuthProvider';
import { homePathFor } from '@/features/auth/permissions';
import { adherenceOf } from '@/features/medicaments/status';
import { intlLocale } from '@/lib/format';
import * as api from '../api';
import { usePatientRecord } from '../hooks';
import { AppointmentForm } from './AppointmentForm';
import { MoodChart } from './MoodChart';

/**
 * Fiche patient (médecin / infirmier affecté) : identité, humeur 30 jours, symptômes, observance,
 * prescriptions, observations infirmières, rendez-vous. Jamais le journal privé.
 */
export default function PatientRecord() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation();
  const { profile } = useAuth();
  const locale = intlLocale(i18n.language);
  const record = usePatientRecord(id);
  const [addingAppt, setAddingAppt] = useState(false);
  const name = (p: { first_name: string; last_name: string } | null) =>
    p ? `${p.first_name} ${p.last_name}`.trim() : '—';
  const fmtDate = (iso: string, withTime = false) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'short',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  const adherence = record.intakes.data ? adherenceOf(record.intakes.data) : null;
  const missed = (record.intakes.data ?? []).filter(
    (i) => i.status !== 'taken' && new Date(i.scheduled_at).getTime() < Date.now() - 2 * 3600_000,
  ).length;

  if (!profile) return null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <AsyncView state={record.patient} isEmpty={(p) => p === null} empty={t('pro.record.notFound')}>
        {(p) => (
          <ScreenHeader
            title={name(p)}
            subtitle={t('pro.record.subtitle')}
            backTo={homePathFor(profile.role)}
          />
        )}
      </AsyncView>

      <p role="note" className="rounded-xl bg-ink/5 px-3 py-2 text-sm">
        🔒 {t('pro.record.privacy')}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <section className="card">
          <h2 className="text-sm font-normal text-ink/60">{t('pro.record.adherence30')}</h2>
          <p className="text-3xl font-bold text-terracotta">{adherence ?? '–'}%</p>
        </section>
        <section className="card">
          <h2 className="text-sm font-normal text-ink/60">{t('pro.record.missed30')}</h2>
          <p className="text-3xl font-bold text-ink">{record.intakes.data ? missed : '–'}</p>
        </section>
      </div>

      <section className="card">
        <AsyncView state={record.moods}>{(moods) => <MoodChart moods={moods} />}</AsyncView>
      </section>

      <section className="card" aria-labelledby="symptoms-title">
        <h2 id="symptoms-title" className="text-lg">
          {t('pro.symptoms')}
        </h2>
        <AsyncView
          state={record.symptoms}
          isEmpty={(l) => l.length === 0}
          empty={t('journal.symptoms.empty')}
        >
          {(list) => (
            <ul className="mt-2 divide-y divide-black/5">
              {list.map((s) => (
                <li key={s.id} className="py-2">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-ink/60">{fmtDate(s.logged_at, true)}</span>
                    <span className="rounded-full bg-terracotta/10 px-2 py-0.5">
                      {t('journal.symptoms.painShort', { value: s.pain_level ?? 0 })}
                    </span>
                    <span className="rounded-full bg-sage/15 px-2 py-0.5">
                      {t('journal.symptoms.stoolsShort', { value: s.stools_per_day ?? 0 })}
                    </span>
                    {s.on_period && <span className="rounded-full bg-cream px-2 py-0.5">🌸</span>}
                  </div>
                  {s.notes && <p className="mt-1 text-sm whitespace-pre-line">{s.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </AsyncView>
      </section>

      <section className="card" aria-labelledby="rx-title">
        <h2 id="rx-title" className="text-lg">
          {t('pro.prescriptions')}
        </h2>
        <AsyncView
          state={record.prescriptions}
          isEmpty={(l) => l.length === 0}
          empty={t('meds.noPrescription')}
        >
          {(list) => (
            <ul className="mt-2 flex flex-col gap-2">
              {list.map((rx) => (
                <li
                  key={rx.id}
                  className={`rounded-xl border p-3 ${rx.active ? 'border-sage/40' : 'border-black/5 opacity-60'}`}
                >
                  <p className="font-medium">
                    {rx.medication} — {rx.dosage}
                    {!rx.active && <span className="ms-2 text-xs">({t('pro.rx.inactive')})</span>}
                  </p>
                  <p className="text-sm text-ink/70">
                    {rx.times_of_day.map((h) => h.slice(0, 5)).join(' · ')} ·{' '}
                    {rx.end_date
                      ? t('meds.fromTo', { from: fmtDate(rx.start_date), to: fmtDate(rx.end_date) })
                      : t('meds.since', { from: fmtDate(rx.start_date) })}
                  </p>
                  <p className="text-xs text-ink/60">{t('pro.rx.by', { name: name(rx.author) })}</p>
                </li>
              ))}
            </ul>
          )}
        </AsyncView>
      </section>

      <section className="card" aria-labelledby="notes-title">
        <h2 id="notes-title" className="text-lg">
          {t('pro.nursingNotes')}
        </h2>
        <AsyncView state={record.notes} isEmpty={(l) => l.length === 0} empty={t('pro.notes.empty')}>
          {(list) => (
            <ul className="mt-2 flex flex-col gap-2">
              {list.map((n) => (
                <li key={n.id} className="rounded-xl bg-cream p-3 text-sm">
                  <p className="text-xs text-ink/60">
                    {fmtDate(n.created_at, true)} · {name(n.author)}
                  </p>
                  <p className="whitespace-pre-line">{n.content}</p>
                </li>
              ))}
            </ul>
          )}
        </AsyncView>
      </section>

      <section className="card" aria-labelledby="appt-title">
        <div className="flex items-center justify-between">
          <h2 id="appt-title" className="text-lg">
            {t('pro.appointments.title')}
          </h2>
          <button
            className="min-h-11 px-2 text-sm font-medium text-sage-dark underline"
            aria-expanded={addingAppt}
            onClick={() => setAddingAppt((a) => !a)}
          >
            {addingAppt ? t('common.cancel') : `+ ${t('pro.appointments.new')}`}
          </button>
        </div>
        {addingAppt && (
          <AppointmentForm
            onSubmit={async (input) => {
              await api.createAppointment(id, input);
              setAddingAppt(false);
              record.appointments.reload();
            }}
          />
        )}
        <AsyncView
          state={record.appointments}
          isEmpty={(l) => l.length === 0}
          empty={t('pro.appointments.empty')}
        >
          {(list) => (
            <ul className="mt-2 divide-y divide-black/5">
              {list.map((a) => (
                <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                  <span className="flex-1">
                    📅 {fmtDate(a.starts_at, true)}
                    {a.location ? ` · ${a.location}` : ''}
                  </span>
                  {a.professional_id === profile.id && (
                    <button
                      className="min-h-11 px-2 text-terracotta"
                      onClick={async () => {
                        if (!confirm(t('pro.appointments.confirmDelete'))) return;
                        await api.deleteAppointment(a.id);
                        record.appointments.reload();
                      }}
                    >
                      {t('community.delete')}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </AsyncView>
      </section>
    </div>
  );
}

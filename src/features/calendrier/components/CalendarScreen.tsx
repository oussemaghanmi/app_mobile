import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePatientContext } from '@/components/PatientLayout';
import { intlLocale } from '@/lib/format';
import { displayStatus } from '@/features/medicaments/status';
import { IntakeRow } from '@/features/medicaments/components/IntakeRow';
import { useMonthData } from '../hooks';
import { addMonths, byDay, dayKey, monthGrid, monthStart } from '../month';

/** Calendrier mensuel des prises (pris / oublié / à venir) et des rendez-vous. */
export default function CalendarScreen() {
  const { t, i18n } = useTranslation();
  const locale = intlLocale(i18n.language);
  const { intakesReady } = usePatientContext();
  const [month, setMonth] = useState(() => monthStart(new Date()));
  const [selected, setSelected] = useState(() => dayKey(new Date()));
  const { intakes, appointments } = useMonthData(month, intakesReady);

  const intakesByDay = useMemo(() => byDay(intakes.data ?? [], (i) => i.scheduled_at), [intakes.data]);
  const apptByDay = useMemo(() => byDay(appointments.data ?? [], (a) => a.starts_at), [appointments.data]);
  const cells = monthGrid(month);
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i).toLocaleDateString(locale, { weekday: 'narrow' }),
  );
  const today = dayKey(new Date());
  const dayIntakes = intakesByDay.get(selected) ?? [];
  const dayAppts = apptByDay.get(selected) ?? [];

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('sections.calendar')} />

      <section className="card" aria-labelledby="month-title">
        <div className="flex items-center justify-between">
          <button
            className="h-11 w-11 rounded-full text-xl text-sage-dark active:bg-sage/10"
            aria-label={t('calendar.prev')}
            onClick={() => setMonth((m) => addMonths(m, -1))}
          >
            <span aria-hidden className="inline-block rtl:rotate-180">
              ‹
            </span>
          </button>
          <h2 id="month-title" className="text-lg capitalize" aria-live="polite">
            {month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
          </h2>
          <button
            className="h-11 w-11 rounded-full text-xl text-sage-dark active:bg-sage/10"
            aria-label={t('calendar.next')}
            onClick={() => setMonth((m) => addMonths(m, 1))}
          >
            <span aria-hidden className="inline-block rtl:rotate-180">
              ›
            </span>
          </button>
        </div>

        <div className="mt-2 grid grid-cols-7 text-center text-xs text-ink/60" aria-hidden>
          {weekdays.map((w, i) => (
            <span key={i}>{w}</span>
          ))}
        </div>
        <div role="grid" aria-labelledby="month-title" className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const k = dayKey(d);
            const list = intakesByDay.get(k) ?? [];
            const statuses = list.map((x) => displayStatus(x));
            const taken = statuses.filter((s) => s === 'taken').length;
            const missed = statuses.filter((s) => s === 'missed').length;
            const upcoming = list.length - taken - missed;
            const appts = apptByDay.get(k)?.length ?? 0;
            const label = [
              d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }),
              list.length ? t('calendar.summary', { taken, missed, upcoming }) : '',
              appts ? t('calendar.appointmentsCount', { count: appts }) : '',
            ]
              .filter(Boolean)
              .join(', ');
            return (
              <button
                key={k}
                role="gridcell"
                aria-selected={selected === k}
                aria-label={label}
                onClick={() => setSelected(k)}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl text-sm ${
                  selected === k
                    ? 'bg-sage text-white'
                    : k === today
                      ? 'ring-2 ring-sage'
                      : 'active:bg-sage/10'
                }`}
              >
                <span className="font-medium">{d.getDate()}</span>
                <span aria-hidden className="flex h-2 gap-0.5">
                  {taken > 0 && <span className="h-1.5 w-1.5 rounded-full bg-sage-dark" />}
                  {missed > 0 && <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />}
                  {upcoming > 0 && <span className="h-1.5 w-1.5 rounded-full bg-ink/30" />}
                  {appts > 0 && <span className="h-1.5 w-1.5 rotate-45 bg-amber-500" />}
                </span>
              </button>
            );
          })}
        </div>

        <ul className="mt-3 flex flex-wrap gap-3 text-xs text-ink/70" aria-label={t('calendar.legend')}>
          <li className="flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full bg-sage-dark" />
            {t('meds.status.taken')}
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full bg-terracotta" />
            {t('meds.status.missed')}
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rounded-full bg-ink/30" />
            {t('meds.status.upcoming')}
          </li>
          <li className="flex items-center gap-1">
            <span aria-hidden className="h-2 w-2 rotate-45 bg-amber-500" />
            {t('calendar.appointment')}
          </li>
        </ul>
      </section>

      <section className="card" aria-labelledby="day-title">
        <h2 id="day-title" className="text-lg capitalize">
          {new Date(`${selected}T12:00:00`).toLocaleDateString(locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          })}
        </h2>
        {dayAppts.length > 0 && (
          <ul className="mt-2 flex flex-col gap-2">
            {dayAppts.map((a) => (
              <li key={a.id} className="rounded-xl bg-amber-50 p-3">
                <p className="font-medium">
                  📅 {t('calendar.appointment')} —{' '}
                  {new Date(a.starts_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                </p>
                {a.location && <p className="text-sm">📍 {a.location}</p>}
                {a.notes && <p className="text-sm text-ink/70">{a.notes}</p>}
              </li>
            ))}
          </ul>
        )}
        {dayIntakes.length > 0 ? (
          <ul className="mt-2 divide-y divide-black/5">
            {dayIntakes.map((i) => (
              <IntakeRow key={i.id} intake={i} locale={locale} />
            ))}
          </ul>
        ) : (
          dayAppts.length === 0 && <p className="mt-2 text-ink/60">{t('calendar.nothing')}</p>
        )}
      </section>
    </div>
  );
}

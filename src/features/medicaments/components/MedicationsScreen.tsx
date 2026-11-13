import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Tabs } from '@/components/ui/Tabs';
import { AsyncView } from '@/components/AsyncView';
import { usePatientContext } from '@/components/PatientLayout';
import { useMedications } from '../hooks';
import { adherenceOf, groupByDay } from '../status';
import { IntakeRow } from './IntakeRow';

type Tab = 'today' | 'treatment' | 'history';

/** Écran Médicaments : prises du jour, traitement en cours (lecture seule), historique, observance. */
export default function MedicationsScreen() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'tn' ? 'ar-TN' : i18n.language;
  const { intakesReady } = usePatientContext();
  const { prescriptions, today, history, adherence, markTaken } = useMedications(intakesReady);
  const [tab, setTab] = useState<Tab>('today');
  const weekAdherence = history.data ? adherenceOf(history.data) : null;
  const fmtDate = (d: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(d).toLocaleDateString(locale, opts);

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('sections.meds')} />

      <div className="grid grid-cols-2 gap-3">
        <section className="card">
          <h2 className="text-sm font-normal text-ink/60">{t('meds.adherenceMonth')}</h2>
          <p className="text-3xl font-bold text-terracotta">{adherence.data ?? '–'}%</p>
        </section>
        <section className="card">
          <h2 className="text-sm font-normal text-ink/60">{t('meds.adherence14')}</h2>
          <p className="text-3xl font-bold text-sage-dark">{weekAdherence ?? '–'}%</p>
        </section>
      </div>

      <Tabs
        label={t('meds.tabsLabel')}
        active={tab}
        onChange={setTab}
        tabs={(['today', 'treatment', 'history'] as Tab[]).map((key) => ({
          key,
          label: t(`meds.tabs.${key}`),
        }))}
      >
        {tab === 'today' && (
          <section className="card" aria-label={t('meds.tabs.today')}>
            <AsyncView state={today} isEmpty={(l) => l.length === 0} empty={t('meds.noIntakeToday')}>
              {(list) => (
                <ul className="divide-y divide-black/5">
                  {list.map((i) => (
                    <IntakeRow key={i.id} intake={i} locale={locale} onTake={markTaken} />
                  ))}
                </ul>
              )}
            </AsyncView>
          </section>
        )}

        {tab === 'treatment' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink/60">{t('meds.readOnly')}</p>
            <AsyncView state={prescriptions} isEmpty={(l) => l.length === 0} empty={t('meds.noPrescription')}>
              {(list) => (
                <ul className="flex flex-col gap-3">
                  {list.map((p) => (
                    <li key={p.id} className="card">
                      <h3 className="text-lg">{p.medication}</h3>
                      <p className="text-ink/70">{p.dosage}</p>
                      <p className="mt-2 text-sm">
                        <span className="text-ink/60">{t('meds.times')} : </span>
                        {p.times_of_day.map((h) => h.slice(0, 5)).join(' · ')}
                      </p>
                      <p className="text-sm text-ink/60">
                        {p.end_date
                          ? t('meds.fromTo', {
                              from: fmtDate(p.start_date, { day: 'numeric', month: 'short' }),
                              to: fmtDate(p.end_date, { day: 'numeric', month: 'short' }),
                            })
                          : t('meds.since', {
                              from: fmtDate(p.start_date, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }),
                            })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </AsyncView>
          </div>
        )}

        {tab === 'history' && (
          <AsyncView state={history} isEmpty={(l) => l.length === 0} empty={t('meds.noHistory')}>
            {(list) => (
              <div className="flex flex-col gap-3">
                {groupByDay(list)
                  .reverse()
                  .map(([day, items]) => (
                    <section key={day} className="card">
                      <h3 className="mb-1 text-base capitalize">
                        {fmtDate(`${day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}
                      </h3>
                      <ul className="divide-y divide-black/5">
                        {items.map((i) => (
                          <IntakeRow key={i.id} intake={i} locale={locale} />
                        ))}
                      </ul>
                    </section>
                  ))}
              </div>
            )}
          </AsyncView>
        )}
      </Tabs>
    </div>
  );
}

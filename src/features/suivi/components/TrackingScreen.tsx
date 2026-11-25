import { useTranslation } from 'react-i18next';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { DailyBarChart } from '@/components/ui/DailyBarChart';
import { AsyncView } from '@/components/AsyncView';
import { Icon } from '@/components/ui/Icon';
import { adherenceOf } from '@/features/medicaments/status';
import { intlLocale } from '@/lib/format';
import { useTracking } from '../hooks';
import { latestPerDay, toPoints } from '../series';

/**
 * « Mon suivi » (#111) : douleur, selles et humeur des 30 derniers jours, plus l'observance.
 * Uniquement les données déjà saisies par le patient ; aucune interprétation des valeurs (règle 7).
 */
export default function TrackingScreen() {
  const { t, i18n } = useTranslation();
  const locale = intlLocale(i18n.language);
  const { days, symptoms, moods, intakes } = useTracking();
  const labels = { date: t('tracking.date'), value: t('tracking.value'), noData: t('tracking.noData') };

  return (
    <div className="flex flex-col gap-4 p-4">
      <ScreenHeader title={t('sections.tracking')} subtitle={t('tracking.subtitle')} />
      <p role="note" className="flex gap-2 rounded-xl bg-sage/10 px-3 py-2 text-sm text-ink/80">
        <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0 text-sage-dark" />
        <span>{t('tracking.note')}</span>
      </p>

      <AsyncView state={intakes}>
        {(list) => {
          const value = adherenceOf(list);
          return (
            <section className="card" aria-labelledby="adherence-title">
              <h2 id="adherence-title" className="text-lg">
                {t('tracking.adherence')}
              </h2>
              <p className="mt-1">
                {value === null ? t('tracking.noData') : t('tracking.adherenceValue', { value })}
              </p>
            </section>
          );
        }}
      </AsyncView>

      <AsyncView state={symptoms}>
        {(rows) => {
          const stools = latestPerDay(rows, (r) => r.stools_per_day);
          const stoolsMax = Math.max(5, ...stools.values());
          return (
            <>
              <DailyBarChart
                title={t('tracking.pain')}
                points={toPoints(
                  days,
                  latestPerDay(rows, (r) => r.pain_level),
                )}
                max={10}
                formatValue={(v) => `${v}/10`}
                locale={locale}
                labels={labels}
              />
              <DailyBarChart
                title={t('tracking.stools')}
                points={toPoints(days, stools)}
                max={stoolsMax}
                formatValue={(v) => String(v)}
                locale={locale}
                labels={labels}
              />
            </>
          );
        }}
      </AsyncView>

      <AsyncView state={moods}>
        {(rows) => (
          <DailyBarChart
            title={t('tracking.mood')}
            points={toPoints(days, new Map(rows.map((m) => [m.day, m.mood])))}
            max={5}
            formatValue={(v) => `${v}/5`}
            locale={locale}
            labels={labels}
          />
        )}
      </AsyncView>

      <p className="text-xs text-ink/70">{t('tracking.lastOfDay')}</p>
    </div>
  );
}

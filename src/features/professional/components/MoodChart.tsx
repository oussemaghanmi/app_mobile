import { useTranslation } from 'react-i18next';
import { dayKey } from '@/features/medicaments/status';
import { intlLocale } from '@/lib/format';
import type { MoodLog } from '../types';

const MOOD_EMOJI = ['😣', '🙁', '😐', '🙂', '😄'];

/**
 * Humeur des 30 derniers jours : une barre fine par jour (hauteur = humeur 1–5), une seule teinte,
 * jours sans saisie laissés vides. Infobulle au survol / focus et tableau des valeurs pour l'accessibilité.
 */
export function MoodChart({ moods, days = 30 }: { moods: MoodLog[]; days?: number }) {
  const { t, i18n } = useTranslation();
  const locale = intlLocale(i18n.language);
  const byDay = new Map(moods.map((m) => [m.day, m.mood]));
  const series = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return { date: d, mood: byDay.get(dayKey(d)) ?? null };
  });
  const filled = series.filter((s) => s.mood !== null);
  const avg = filled.length ? filled.reduce((a, s) => a + (s.mood ?? 0), 0) / filled.length : null;
  const fmt = (d: Date) => d.toLocaleDateString(locale, { day: 'numeric', month: 'short' });

  return (
    <figure className="m-0">
      <figcaption className="flex items-baseline justify-between">
        <span className="font-serif text-lg">{t('pro.record.mood')}</span>
        <span className="text-sm text-ink/60">
          {avg !== null ? t('pro.record.moodAverage', { value: avg.toFixed(1) }) : t('pro.record.noData')}
        </span>
      </figcaption>
      <div className="mt-3 flex h-24 items-end gap-[2px] border-b border-ink/15" aria-hidden>
        {series.map((s) => (
          <div key={s.date.toISOString()} className="group relative flex h-full flex-1 items-end">
            {s.mood !== null && (
              <div
                className="w-full rounded-t-[4px] bg-sage-dark/80 group-hover:bg-sage-dark"
                style={{ height: `${(s.mood / 5) * 100}%` }}
              />
            )}
            <span className="pointer-events-none absolute bottom-full start-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-md bg-ink px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block rtl:translate-x-1/2">
              {fmt(s.date)} · {s.mood !== null ? `${MOOD_EMOJI[s.mood - 1]} ${s.mood}/5` : '—'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-ink/60" aria-hidden>
        <span>{fmt(series[0].date)}</span>
        <span>{fmt(series[series.length - 1].date)}</span>
      </div>
      <details className="mt-2 text-sm">
        <summary className="min-h-11 cursor-pointer py-2 text-sage-dark">
          {t('pro.record.showValues')}
        </summary>
        <table className="w-full text-start">
          <thead>
            <tr className="text-ink/60">
              <th className="text-start font-normal">{t('pro.record.date')}</th>
              <th className="text-start font-normal">{t('pro.record.moodValue')}</th>
            </tr>
          </thead>
          <tbody>
            {filled.map((s) => (
              <tr key={s.date.toISOString()}>
                <td>{fmt(s.date)}</td>
                <td>
                  {MOOD_EMOJI[(s.mood ?? 1) - 1]} {s.mood}/5
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

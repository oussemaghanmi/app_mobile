import { useId } from 'react';

/** Valeur d'un jour (AAAA-MM-JJ) ; null = aucune saisie ce jour-là (place laissée vide). */
export interface DayPoint {
  day: string;
  value: number | null;
}

interface Props {
  title: string;
  /** Du plus ancien au plus récent. En RTL, la rangée s'inverse : le plus ancien est à droite. */
  points: DayPoint[];
  /** Valeur correspondant à une barre pleine (échelle fixe, ex. 10 pour la douleur). */
  max: number;
  formatValue: (value: number) => string;
  /** Langue Intl des dates (voir intlLocale). */
  locale: string;
  labels: { date: string; value: string; noData: string };
}

/** Date AAAA-MM-JJ lue en UTC : le jour affiché ne dépend pas du fuseau de l'appareil. */
const formatDay = (day: string, locale: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });

/**
 * Graphique en barres, une barre par jour, sans bibliothèque (comme MoodChart) : une seule teinte (sage-dark,
 * contraste 6:1), hauteur proportionnelle à la valeur, AUCUNE interprétation (ni seuil ni couleur « bonne »
 * ou « mauvaise »). Accessible : <figure> légendée et tableau des valeurs saisies, toujours lu par les
 * lecteurs d'écran ; les barres elles-mêmes sont décoratives. Aucun élément interactif.
 */
export function DailyBarChart({ title, points, max, formatValue, locale, labels }: Props) {
  const titleId = useId();
  const filled = points.filter((p): p is { day: string; value: number } => p.value !== null);

  return (
    <figure className="card m-0" aria-labelledby={titleId}>
      <figcaption id={titleId} className="font-serif text-lg">
        {title}
      </figcaption>
      {filled.length === 0 ? (
        <p className="mt-2 text-sm text-ink/70">{labels.noData}</p>
      ) : (
        <>
          <div className="mt-3 flex items-stretch gap-2" aria-hidden>
            <div className="flex flex-col justify-between text-xs text-ink/70 tabular-nums">
              <span>{formatValue(max)}</span>
              <span>0</span>
            </div>
            <div className="flex h-28 flex-1 items-end gap-[2px] border-b border-s border-ink/30 ps-0.5">
              {points.map((p) => (
                <div key={p.day} data-day={p.day} className="flex h-full flex-1 items-end">
                  {p.value !== null && (
                    <div
                      data-bar
                      className="w-full rounded-t-[3px] bg-sage-dark"
                      // Une valeur 0 saisie garde un trait de 3 px : elle ne doit pas ressembler à un jour sans saisie.
                      style={{ height: p.value === 0 ? '3px' : `${Math.min(100, (p.value / max) * 100)}%` }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-1 flex justify-between ps-8 text-xs text-ink/70" aria-hidden>
            <span>{formatDay(points[0].day, locale)}</span>
            <span>{formatDay(points[points.length - 1].day, locale)}</span>
          </div>
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">{labels.date}</th>
                <th scope="col">{labels.value}</th>
              </tr>
            </thead>
            <tbody>
              {filled.map((p) => (
                <tr key={p.day}>
                  <td>{formatDay(p.day, locale)}</td>
                  <td>{formatValue(p.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}

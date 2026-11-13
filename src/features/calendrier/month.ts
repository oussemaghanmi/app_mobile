import { dayKey } from '@/features/medicaments/status';

/** Premier jour du mois (minuit local). */
export const monthStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
export const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1);

/**
 * Cases de la grille mensuelle, semaines commençant le lundi.
 * `null` = case vide avant le 1er / après le dernier jour.
 */
export function monthGrid(month: Date): (Date | null)[] {
  const first = monthStart(month);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // lundi = 0
  const cells: (Date | null)[] = Array.from({ length: lead }, () => null);
  for (let i = 1; i <= days; i++) cells.push(new Date(first.getFullYear(), first.getMonth(), i));
  while (cells.length % 7) cells.push(null);
  return cells;
}

/** Index par jour local AAAA-MM-JJ. */
export function byDay<T>(items: T[], date: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = dayKey(new Date(date(it)));
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return map;
}

export { dayKey };

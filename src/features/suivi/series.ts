import { toTunisDate } from '@/lib/dates';
import type { DayPoint } from '@/components/ui/DailyBarChart';

/** Les n derniers jours calendaires (AAAA-MM-JJ) jusqu'à `today` inclus, du plus ancien au plus récent. */
export function lastDays(n: number, today: string): string[] {
  const [y, m, d] = today.split('-').map(Number);
  return Array.from({ length: n }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d - (n - 1 - i))).toISOString().slice(0, 10),
  );
}

/**
 * Valeur retenue pour chaque jour (jour calendaire de Tunis) : la DERNIÈRE saisie du jour.
 * Les saisies sans valeur sont ignorées : le jour reste vide plutôt que de valoir 0.
 */
export function latestPerDay<T extends { logged_at: string }>(
  rows: T[],
  value: (row: T) => number | null,
): Map<string, number> {
  const latest = new Map<string, { at: number; value: number }>();
  for (const row of rows) {
    const v = value(row);
    if (v === null) continue;
    const at = new Date(row.logged_at).getTime();
    const day = toTunisDate(new Date(row.logged_at));
    const current = latest.get(day);
    if (!current || at > current.at) latest.set(day, { at, value: v });
  }
  return new Map([...latest].map(([day, { value: v }]) => [day, v]));
}

export const toPoints = (days: string[], values: Map<string, number>): DayPoint[] =>
  days.map((day) => ({ day, value: values.get(day) ?? null }));

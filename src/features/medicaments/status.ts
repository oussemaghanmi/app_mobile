import type { DisplayStatus, Intake } from './types';

/** Délai après l'heure prévue au-delà duquel une prise non cochée est considérée comme oubliée. */
export const MISSED_AFTER_MS = 2 * 60 * 60 * 1000;

export function displayStatus(
  intake: Pick<Intake, 'status' | 'scheduled_at'>,
  now = new Date(),
): DisplayStatus {
  if (intake.status === 'taken') return 'taken';
  if (intake.status === 'skipped') return 'skipped';
  const delta = now.getTime() - new Date(intake.scheduled_at).getTime();
  if (delta > MISSED_AFTER_MS) return 'missed';
  if (delta > 0) return 'late';
  return 'upcoming';
}

/** Observance (%) sur les prises échues ou déjà cochées en avance ; null s'il n'y en a aucune. */
export function adherenceOf(
  intakes: Pick<Intake, 'status' | 'scheduled_at'>[],
  now = new Date(),
): number | null {
  const due = intakes.filter((i) => i.status === 'taken' || new Date(i.scheduled_at) <= now);
  if (!due.length) return null;
  return Math.round((100 * due.filter((i) => i.status === 'taken').length) / due.length);
}

/** Clé de jour locale AAAA-MM-JJ. */
export const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function groupByDay<T extends { scheduled_at: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = dayKey(new Date(it.scheduled_at));
    map.set(k, [...(map.get(k) ?? []), it]);
  }
  return [...map.entries()];
}

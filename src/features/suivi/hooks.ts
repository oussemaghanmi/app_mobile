import { useAsync } from '@/lib/useAsync';
import { todayInTunis } from '@/lib/dates';
import { lastDays } from './series';
import * as api from './api';

export const TRACKING_DAYS = 30;

/** Données des 30 derniers jours pour l'écran « Mon suivi ». */
export function useTracking() {
  const days = lastDays(TRACKING_DAYS, todayInTunis());
  // Une journée de marge : le premier jour affiché commence à minuit, heure de Tunis.
  const since = new Date(`${days[0]}T00:00:00Z`);
  since.setUTCDate(since.getUTCDate() - 1);
  return {
    days,
    symptoms: useAsync(() => api.fetchSymptomsSince(since), [days[0]]),
    moods: useAsync(() => api.fetchMoodsSince(days[0]), [days[0]]),
    intakes: useAsync(() => api.fetchIntakesSince(since), [days[0]]),
  };
}

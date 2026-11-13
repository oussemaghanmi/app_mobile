import { useEffect, useState } from 'react';
import { useAsync } from '@/lib/useAsync';
import * as api from './api';
import { cancelReminder } from '@/features/rappels/notifications';

/**
 * Génère les prises des prochains jours à l'ouverture de l'espace patient.
 * `ready` passe à true une fois la génération terminée (ou en échec : l'app reste utilisable).
 */
export function useIntakeGeneration(enabled: boolean) {
  const [ready, setReady] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    api
      .generateIntakes()
      .catch(() => 0)
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return ready;
}

const startOfDay = (offsetDays = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
};

/** Données de l'écran Médicaments : prescriptions, prises du jour, historique 14 jours, observance. */
export function useMedications(ready: boolean) {
  const prescriptions = useAsync(() => api.fetchActivePrescriptions(), [ready]);
  const today = useAsync(() => api.fetchIntakesBetween(startOfDay(0), startOfDay(1)), [ready]);
  const history = useAsync(() => api.fetchIntakesBetween(startOfDay(-14), startOfDay(1)), [ready]);
  const adherence = useAsync(() => api.fetchAdherence(), [ready]);

  const markTaken = async (id: string) => {
    await api.markIntakeTaken(id);
    cancelReminder(id).catch(() => undefined);
    today.reload();
    history.reload();
    adherence.reload();
  };

  return { prescriptions, today, history, adherence, markTaken };
}

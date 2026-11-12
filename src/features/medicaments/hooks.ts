import { useEffect, useState } from 'react';
import { generateIntakes } from './api';

/**
 * Génère les prises des prochains jours à l'ouverture de l'espace patient.
 * `ready` passe à true une fois la génération terminée (ou en échec : l'app reste utilisable).
 */
export function useIntakeGeneration(enabled: boolean) {
  const [ready, setReady] = useState(!enabled);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    generateIntakes()
      .catch(() => 0)
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [enabled]);
  return ready;
}

const tunisFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Tunis',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/**
 * Formate un objet Date en chaîne ISO de jour calendaire (YYYY-MM-DD)
 * selon le fuseau horaire de Tunis (Africa/Tunis).
 */
export function toTunisDate(d: Date): string {
  const parts = tunisFormatter.formatToParts(d);
  let year = '';
  let month = '';
  let day = '';
  for (const part of parts) {
    if (part.type === 'year') year = part.value;
    else if (part.type === 'month') month = part.value;
    else if (part.type === 'day') day = part.value;
  }
  return `${year}-${month}-${day}`;
}

/**
 * Retourne le jour calendaire actuel (YYYY-MM-DD) à l'heure de Tunis.
 */
export function todayInTunis(now: Date = new Date()): string {
  return toTunisDate(now);
}

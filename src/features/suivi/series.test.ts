import { lastDays, latestPerDay, toPoints } from './series';

describe('lastDays()', () => {
  it('renvoie les n derniers jours, du plus ancien au plus récent', () => {
    expect(lastDays(3, '2026-11-24')).toEqual(['2026-11-22', '2026-11-23', '2026-11-24']);
  });
  it('traverse les changements de mois et d’année', () => {
    expect(lastDays(3, '2026-01-01')).toEqual(['2025-12-30', '2025-12-31', '2026-01-01']);
  });
});

describe('latestPerDay()', () => {
  it('garde la dernière saisie de chaque jour, au jour calendaire de Tunis', () => {
    const map = latestPerDay(
      [
        { logged_at: '2026-11-23T08:00:00Z', value: 2 },
        { logged_at: '2026-11-23T20:00:00Z', value: 6 },
        // 23 h 30 UTC = 0 h 30 le 24 à Tunis
        { logged_at: '2026-11-23T23:30:00Z', value: 4 },
        { logged_at: '2026-11-22T10:00:00Z', value: null },
      ],
      (r) => r.value,
    );
    expect(map.get('2026-11-23')).toBe(6);
    expect(map.get('2026-11-24')).toBe(4);
    expect(map.has('2026-11-22')).toBe(false); // valeur absente : jour laissé vide
  });
});

describe('toPoints()', () => {
  it('associe chaque jour à sa valeur ou à null', () => {
    expect(toPoints(['2026-11-23', '2026-11-24'], new Map([['2026-11-24', 5]]))).toEqual([
      { day: '2026-11-23', value: null },
      { day: '2026-11-24', value: 5 },
    ]);
  });
});

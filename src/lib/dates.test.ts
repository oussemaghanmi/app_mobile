import { describe, expect, it } from 'vitest';
import { todayInTunis, toTunisDate } from './dates';

describe('toTunisDate & todayInTunis', () => {
  it('bascule au jour suivant à minuit heure de Tunis (23:30Z)', () => {
    // 23:30 UTC = 00:30 le lendemain à Tunis (UTC+1)
    const d = new Date('2026-11-20T23:30:00Z');
    expect(toTunisDate(d)).toBe('2026-11-21');
    expect(todayInTunis(d)).toBe('2026-11-21');
  });

  it('reste sur le même jour avant minuit heure de Tunis (22:59Z)', () => {
    // 22:59 UTC = 23:59 le même jour à Tunis (UTC+1)
    const d = new Date('2026-11-20T22:59:00Z');
    expect(toTunisDate(d)).toBe('2026-11-20');
    expect(todayInTunis(d)).toBe('2026-11-20');
  });

  it('gère correctement une année bissextile (29 février)', () => {
    const leapDay = new Date('2024-02-29T12:00:00Z');
    expect(toTunisDate(leapDay)).toBe('2024-02-29');

    const leapEve = new Date('2024-02-28T23:30:00Z');
    expect(toTunisDate(leapEve)).toBe('2024-02-29');
  });

  it('gère le premier jour de l’an', () => {
    const newYear = new Date('2025-12-31T23:15:00Z');
    expect(toTunisDate(newYear)).toBe('2026-01-01');
  });

  it('todayInTunis retourne une chaîne YYYY-MM-DD valide par défaut', () => {
    const result = todayInTunis();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

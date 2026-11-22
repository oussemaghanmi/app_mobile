import { intlLocale, timeAgo } from './format';

describe('format', () => {
  const now = new Date('2026-11-13T12:00:00Z').getTime();
  it('formate un temps relatif', () => {
    expect(timeAgo('2026-11-13T09:00:00Z', 'fr', now)).toBe('il y a 3 heures');
    expect(timeAgo('2026-11-12T12:00:00Z', 'en', now)).toBe('yesterday');
    expect(timeAgo('2026-11-13T11:59:50Z', 'fr', now)).toBe('cette minute-ci');
  });
  it('mappe la darija sur ar-TN', () => {
    expect(intlLocale('tn')).toBe('ar-TN');
    expect(intlLocale('fr')).toBe('fr');
  });
});

import { addMonths, byDay, monthGrid } from './month';

describe('monthGrid', () => {
  it('commence le lundi et complète les semaines', () => {
    // novembre 2026 : le 1er est un dimanche → 6 cases vides avant
    const cells = monthGrid(new Date(2026, 10, 15));
    expect(cells.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(cells[6]?.getDate()).toBe(1);
    expect(cells.length % 7).toBe(0);
    expect(cells.filter(Boolean)).toHaveLength(30);
  });
  it('change de mois et d’année', () => {
    expect(addMonths(new Date(2026, 11, 31), 1)).toEqual(new Date(2027, 0, 1));
  });
});

describe('byDay', () => {
  it('indexe par jour local', () => {
    const m = byDay([{ at: '2026-11-13T08:00:00' }, { at: '2026-11-13T20:00:00' }], (x) => x.at);
    expect(m.get('2026-11-13')).toHaveLength(2);
  });
});

import { adherenceOf, displayStatus, groupByDay } from './status';

const now = new Date('2026-11-13T12:00:00');
const at = (h: number) => new Date(now.getTime() + h * 3_600_000).toISOString();

describe('displayStatus', () => {
  it('distingue pris, sauté, à venir, en retard et oublié', () => {
    expect(displayStatus({ status: 'taken', scheduled_at: at(-5) }, now)).toBe('taken');
    expect(displayStatus({ status: 'skipped', scheduled_at: at(-5) }, now)).toBe('skipped');
    expect(displayStatus({ status: 'pending', scheduled_at: at(1) }, now)).toBe('upcoming');
    expect(displayStatus({ status: 'pending', scheduled_at: at(-1) }, now)).toBe('late');
    expect(displayStatus({ status: 'pending', scheduled_at: at(-3) }, now)).toBe('missed');
  });
});

describe('adherenceOf', () => {
  it('ne compte que les prises échues', () => {
    expect(
      adherenceOf(
        [
          { status: 'taken', scheduled_at: at(-10) },
          { status: 'pending', scheduled_at: at(-5) },
          { status: 'pending', scheduled_at: at(5) },
        ],
        now,
      ),
    ).toBe(50);
  });
  it('compte une prise cochée en avance', () => {
    expect(adherenceOf([{ status: 'taken', scheduled_at: at(1) }], now)).toBe(100);
  });
  it('renvoie null sans prise échue', () => {
    expect(adherenceOf([{ status: 'pending', scheduled_at: at(2) }], now)).toBeNull();
  });
});

describe('groupByDay', () => {
  it('regroupe par jour local', () => {
    const groups = groupByDay([
      { scheduled_at: '2026-11-12T08:00:00' },
      { scheduled_at: '2026-11-12T20:00:00' },
      { scheduled_at: '2026-11-13T08:00:00' },
    ]);
    expect(groups.map(([d, list]) => [d, list.length])).toEqual([
      ['2026-11-12', 2],
      ['2026-11-13', 1],
    ]);
  });
});

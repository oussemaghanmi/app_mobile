import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TrackingScreen from './TrackingScreen';
import type { AsyncState } from '@/lib/useAsync';

const ok = <T,>(data: T): AsyncState<T> => ({ data, loading: false, error: null, reload: vi.fn() });
let data: ReturnType<typeof makeData>;
const makeData = (withValues: boolean) => ({
  days: ['2026-11-22', '2026-11-23', '2026-11-24'],
  symptoms: ok(
    withValues
      ? [
          { logged_at: '2026-11-22T09:00:00Z', pain_level: 4, stools_per_day: 3 },
          { logged_at: '2026-11-24T09:00:00Z', pain_level: 2, stools_per_day: null },
        ]
      : [],
  ),
  moods: ok(withValues ? [{ day: '2026-11-23', mood: 4 }] : []),
  intakes: ok(
    withValues
      ? [
          { status: 'taken' as const, scheduled_at: '2026-11-22T08:00:00Z' },
          { status: 'pending' as const, scheduled_at: '2026-11-23T08:00:00Z' },
        ]
      : [],
  ),
});
vi.mock('../hooks', () => ({ useTracking: () => data }));

const renderScreen = () =>
  render(
    <MemoryRouter>
      <TrackingScreen />
    </MemoryRouter>,
  );

describe('<TrackingScreen />', () => {
  it('affiche les 3 graphiques légendés et l’observance, à partir des saisies', () => {
    data = makeData(true);
    renderScreen();
    expect(screen.getByRole('heading', { level: 1, name: 'Mon suivi' })).toBeInTheDocument();
    const pain = screen.getByRole('figure', { name: 'Douleur' });
    expect(within(pain).getByText('4/10')).toBeInTheDocument();
    expect(within(pain).getByText('2/10')).toBeInTheDocument();
    const stools = screen.getByRole('figure', { name: 'Selles par jour' });
    expect(within(stools).getAllByRole('row')).toHaveLength(2); // en-tête + 1 jour (le 24 n'a pas de valeur)
    expect(within(screen.getByRole('figure', { name: 'Humeur' })).getByText('4/5')).toBeInTheDocument();
    expect(screen.getByText('50 % des prises sur 30 jours')).toBeInTheDocument();
  });

  it('sans données : chaque graphique et l’observance l’indiquent, sans rien interpréter', () => {
    data = makeData(false);
    renderScreen();
    expect(screen.getAllByText('Pas encore de données sur cette période.')).toHaveLength(4);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

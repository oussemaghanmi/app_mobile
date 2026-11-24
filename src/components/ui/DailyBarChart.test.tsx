import { render, screen, within } from '@testing-library/react';
import { DailyBarChart, type DayPoint } from './DailyBarChart';

const labels = { date: 'Date', value: 'Valeur', noData: 'Pas de données.' };
const points: DayPoint[] = [
  { day: '2026-11-01', value: 3 },
  { day: '2026-11-02', value: null },
  { day: '2026-11-03', value: 7 },
];

describe('<DailyBarChart />', () => {
  it('est une figure légendée avec un tableau des valeurs saisies uniquement', () => {
    render(
      <DailyBarChart
        title="Douleur"
        points={points}
        max={10}
        formatValue={(v) => `${v}/10`}
        locale="fr"
        labels={labels}
      />,
    );
    const figure = screen.getByRole('figure', { name: 'Douleur' });
    const rows = within(figure).getAllByRole('row');
    expect(rows).toHaveLength(3); // en-tête + 2 jours saisis
    expect(within(rows[1]).getByText('1 nov.')).toBeInTheDocument();
    expect(within(rows[1]).getByText('3/10')).toBeInTheDocument();
    expect(within(rows[2]).getByText('7/10')).toBeInTheDocument();
  });

  it('garde une place vide pour les jours sans saisie', () => {
    const { container } = render(
      <DailyBarChart
        title="Douleur"
        points={points}
        max={10}
        formatValue={String}
        locale="fr"
        labels={labels}
      />,
    );
    expect(container.querySelectorAll('[data-day]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-bar]')).toHaveLength(2);
    expect(container.querySelector('[data-day="2026-11-02"] [data-bar]')).toBeNull();
    // hauteur proportionnelle à la valeur, sans interprétation
    expect(container.querySelector<HTMLElement>('[data-day="2026-11-03"] [data-bar]')?.style.height).toBe(
      '70%',
    );
  });

  it('une valeur 0 saisie reste visible (trait de 3 px), différente d’un jour sans saisie', () => {
    const { container } = render(
      <DailyBarChart
        title="Douleur"
        points={[
          { day: '2026-11-01', value: 0 },
          { day: '2026-11-02', value: null },
        ]}
        max={10}
        formatValue={(v) => `${v}/10`}
        locale="fr"
        labels={labels}
      />,
    );
    expect(container.querySelector<HTMLElement>('[data-day="2026-11-01"] [data-bar]')?.style.height).toBe(
      '3px',
    );
    expect(container.querySelector('[data-day="2026-11-02"] [data-bar]')).toBeNull();
    expect(screen.getByText('0/10')).toBeInTheDocument();
  });

  it('formate les dates dans la langue affichée', () => {
    render(
      <DailyBarChart
        title="الألم"
        points={points}
        max={10}
        formatValue={String}
        locale="ar"
        labels={labels}
      />,
    );
    const firstDate = screen.getAllByRole('row')[1].querySelector('td')?.textContent ?? '';
    expect(firstDate).toMatch(/نوفمبر/);
  });

  it('sans aucune saisie : message « pas de données » et aucun tableau', () => {
    render(
      <DailyBarChart
        title="Humeur"
        points={[{ day: '2026-11-01', value: null }]}
        max={5}
        formatValue={String}
        locale="fr"
        labels={labels}
      />,
    );
    expect(screen.getByRole('figure', { name: 'Humeur' })).toHaveTextContent('Pas de données.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});

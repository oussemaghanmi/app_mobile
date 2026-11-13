import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PatientHome from './PatientHome';
import type { TodayIntake } from '../types';

const markTaken = vi.fn();
let intakes: TodayIntake[] = [];

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ profile: { id: 'p1', first_name: 'Amina', language: 'fr' } }),
}));
vi.mock('@/components/PatientLayout', () => ({ usePatientContext: () => ({ intakesReady: true }) }));
vi.mock('../hooks', () => ({
  usePatientHome: () => ({ mood: null, saveMood: vi.fn(), intakes, adherence: 80, tip: null, markTaken }),
}));

const intake = (id: string, status: TodayIntake['status'], hoursFromNow: number): TodayIntake => ({
  id,
  status,
  scheduled_at: new Date(Date.now() + hoursFromNow * 3_600_000).toISOString(),
  prescriptions: { medication: `Med ${id}`, dosage: '1 cp' },
});

const renderHome = () =>
  render(
    <MemoryRouter>
      <PatientHome />
    </MemoryRouter>,
  );

describe('<PatientHome /> — prochaine prise', () => {
  beforeEach(() => markTaken.mockReset());

  it('coche la prochaine prise avec le bouton « Pris »', async () => {
    intakes = [intake('a', 'taken', -3), intake('b', 'pending', 2)];
    renderHome();
    expect(screen.getByText('1/2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Marquer comme pris : Med b' }));
    expect(markTaken).toHaveBeenCalledWith('b');
  });

  it('signale une prise en retard', () => {
    intakes = [intake('a', 'pending', -1)];
    renderHome();
    expect(screen.getByText('En retard')).toBeInTheDocument();
  });

  it("affiche une erreur si l'enregistrement échoue", async () => {
    intakes = [intake('a', 'pending', 1)];
    markTaken.mockRejectedValueOnce(new Error('x'));
    renderHome();
    await userEvent.click(screen.getByRole('button', { name: /Marquer comme pris/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent("Impossible d'enregistrer la prise");
  });

  it('sans prise restante, affiche « Aucune prise prévue »', () => {
    intakes = [intake('a', 'taken', -1)];
    renderHome();
    expect(screen.getByText('Aucune prise prévue')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marquer comme pris/ })).not.toBeInTheDocument();
  });
});

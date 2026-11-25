// Tableau de bord soignant (#102) : le lien « Paramètres », seul accès aux Paramètres pour un soignant,
// pointe vers settings et porte une cible tactile d'au moins 44 px (min-h-11 / min-w-11, règle 6).
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProDashboard from './ProDashboard';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ profile: { id: 'd1', role: 'doctor', first_name: 'Karim', last_name: 'B' } }),
}));
vi.mock('../hooks', () => ({
  useAssignedPatients: () => ({
    data: [{ id: 'p1', first_name: 'Amina', last_name: 'B' }],
    loading: false,
    error: null,
    reload: vi.fn(),
  }),
}));

describe('<ProDashboard /> — lien Paramètres', () => {
  it('pointe vers les paramètres du soignant avec une cible de 44 px', () => {
    render(
      <MemoryRouter initialEntries={['/doctor']}>
        <Routes>
          <Route path="/doctor" element={<ProDashboard />} />
        </Routes>
      </MemoryRouter>,
    );
    const link = screen.getByRole('link', { name: 'Paramètres' });
    expect(link).toHaveAttribute('href', '/doctor/settings');
    expect(link).toHaveClass('min-h-11', 'min-w-11');
  });
});

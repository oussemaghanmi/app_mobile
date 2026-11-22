import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import App, { ScreenFallback } from './App';

let authState = {
  session: null as unknown,
  profile: null as unknown,
  loading: false,
};

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => authState,
}));

describe('<App /> — chargement différé et navigation', () => {
  it('affiche le fallback accessible ScreenFallback avec aria-busy', () => {
    render(<ScreenFallback />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-busy', 'true');
    expect(status).toHaveAttribute('aria-label');
  });

  it('charge et affiche un écran lazy (Login) à la navigation vers /login', async () => {
    authState = { session: null, profile: null, loading: false };
    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    );

    const title = await screen.findByRole('heading', { name: 'Connexion' });
    expect(title).toBeInTheDocument();
  });

  it('redirige la racine vers /login lorsque l’utilisateur n’est pas authentifié', async () => {
    authState = { session: null, profile: null, loading: false };
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    );

    const title = await screen.findByRole('heading', { name: 'Connexion' });
    expect(title).toBeInTheDocument();
  });
});

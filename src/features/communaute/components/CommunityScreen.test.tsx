import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommunityScreen from './CommunityScreen';
import type { AsyncState } from '@/lib/useAsync';
import type { Post } from '../types';

let pseudonym: AsyncState<string | null>;
let posts: AsyncState<Post[]>;
const state = <T,>(data: T, loading = false): AsyncState<T> => ({
  data,
  loading,
  error: null,
  reload: vi.fn(),
});

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({ profile: { id: 'u1', role: 'patient' } }),
}));
vi.mock('../hooks', () => ({
  useMyPseudonym: () => pseudonym,
  usePosts: () => posts,
  useComments: () => state([]),
}));
vi.mock('../api', () => ({ createPost: vi.fn(), createPseudonym: vi.fn() }));

const renderScreen = () =>
  render(
    <MemoryRouter>
      <CommunityScreen />
    </MemoryRouter>,
  );

describe('<CommunityScreen />', () => {
  beforeEach(() => {
    posts = state<Post[]>([]);
  });

  it('sans pseudonyme : affiche le choix du pseudonyme, pas le formulaire de publication', () => {
    pseudonym = state<string | null>(null);
    renderScreen();
    expect(screen.getByRole('heading', { name: 'Choisissez votre pseudonyme' })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Publier en tant que/)).not.toBeInTheDocument();
  });

  it('avec un pseudonyme : affiche « Publier en tant que {pseudonyme} »', () => {
    pseudonym = state<string | null>('Jasmin');
    renderScreen();
    expect(screen.getByLabelText('Publier en tant que Jasmin')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Choisissez votre pseudonyme' })).not.toBeInTheDocument();
  });

  it('pendant le chargement du pseudonyme : ni choix du pseudonyme ni formulaire', () => {
    pseudonym = state<string | null>(null, true);
    renderScreen();
    expect(screen.queryByRole('heading', { name: 'Choisissez votre pseudonyme' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Publier en tant que/)).not.toBeInTheDocument();
  });

  it('liste vide : affiche le message dédié', () => {
    pseudonym = state<string | null>('Jasmin');
    renderScreen();
    expect(screen.getByText('Aucune publication pour le moment. Lancez la discussion !')).toBeInTheDocument();
  });
});

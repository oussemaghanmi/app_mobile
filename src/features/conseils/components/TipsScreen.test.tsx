import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n';
import TipsScreen from './TipsScreen';
import type { Tip } from '../api';
import type { AsyncState } from '@/lib/useAsync';

let state: AsyncState<Tip[]>;

vi.mock('../hooks', () => ({ useTips: () => state }));

const tip = (id: number, category: string, fr: string, extra: Partial<Tip> = {}): Tip => ({
  id,
  category,
  fr,
  en: null,
  ar: null,
  tn: null,
  ...extra,
});
const ready = (data: Tip[]): AsyncState<Tip[]> => ({ data, error: null, loading: false, reload: vi.fn() });

const renderScreen = () =>
  render(
    <MemoryRouter>
      <TipsScreen />
    </MemoryRouter>,
  );

describe('<TipsScreen />', () => {
  afterEach(() => i18n.changeLanguage('fr'));

  it('affiche la carte prioritaire « arrêt du tabac » même sans aucun conseil', () => {
    state = ready([]);
    renderScreen();

    const card = screen.getByRole('region', { name: /Arrêter le tabac et la chicha/ });
    expect(within(card).getByText('Priorité')).toBeInTheDocument();
    for (const step of [
      'Fixez une date',
      'Repérez les moments à risque',
      'Prévenez votre entourage',
      'Faites-vous aider',
    ]) {
      expect(within(card).getByText(step)).toBeInTheDocument();
    }
    expect(within(card).getByRole('link', { name: "Pourquoi c'est important (Ma maladie)" })).toHaveAttribute(
      'href',
      '/patient/disease',
    );
  });

  it('affiche l’avis médical général', () => {
    state = ready([]);
    renderScreen();
    expect(screen.getByRole('note')).toHaveTextContent("ne remplace pas l'avis de votre médecin");
  });

  it('affiche chaque conseil avec sa catégorie et son icône', () => {
    state = ready([
      tip(1, 'hydratation', 'Buvez régulièrement.'),
      tip(2, 'sommeil', 'Couchez-vous à heure fixe.'),
    ]);
    renderScreen();

    const items = screen.getAllByRole('listitem').filter((li) => li.classList.contains('card'));
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Hydratation');
    expect(items[0]).toHaveTextContent('Buvez régulièrement.');
    expect(items[0]).toHaveTextContent('💧');
    expect(items[1]).toHaveTextContent('Sommeil');
    expect(items[1]).toHaveTextContent('🌙');
  });

  it('utilise l’icône de repli 💡 pour une catégorie inconnue', () => {
    state = ready([tip(3, 'inconnue', 'Un conseil sans catégorie connue.')]);
    renderScreen();
    expect(screen.getByText('Un conseil sans catégorie connue.').closest('li')).toHaveTextContent('💡');
  });

  it('affiche le conseil dans la langue de l’interface, avec repli sur le français', async () => {
    state = ready([
      tip(4, 'stress', 'Respirez lentement.', { en: 'Breathe slowly.' }),
      tip(5, 'suivi', 'Gardez vos rendez-vous.'),
    ]);
    await i18n.changeLanguage('en');
    renderScreen();
    expect(screen.getByText('Breathe slowly.')).toBeInTheDocument();
    expect(screen.getByText('Gardez vos rendez-vous.')).toBeInTheDocument();
  });

  it('affiche un statut de chargement tant que la liste n’est pas arrivée, carte tabac comprise', () => {
    state = { data: undefined, error: null, loading: true, reload: vi.fn() };
    renderScreen();
    expect(screen.getByRole('status')).toHaveTextContent('Chargement…');
    expect(screen.getByRole('region', { name: /Arrêter le tabac et la chicha/ })).toBeInTheDocument();
  });

  it('affiche une alerte avec « Réessayer » qui relance le chargement', async () => {
    const reload = vi.fn();
    state = { data: undefined, error: new Error('x'), loading: false, reload };
    renderScreen();

    expect(screen.getByRole('alert')).toHaveTextContent('Une erreur est survenue.');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('affiche un message quand la liste est vide', () => {
    state = ready([]);
    renderScreen();
    expect(screen.getByText('Rien à afficher pour le moment.')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DiseaseScreen from './DiseaseScreen';

const TABS = ['Comprendre', 'Symptômes', 'Traitements', 'Vivre avec'];
const EMERGENCY = "Signes d'alerte : consultez en urgence";
const tab = (name: string) => screen.getByRole('tab', { name });
const renderScreen = () =>
  render(
    <MemoryRouter>
      <DiseaseScreen />
    </MemoryRouter>,
  );

describe('<DiseaseScreen />', () => {
  afterEach(() => {
    document.documentElement.dir = 'ltr';
  });

  it('affiche l’onglet « Comprendre » par défaut', () => {
    renderScreen();

    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(TABS);
    expect(tab('Comprendre')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Symptômes')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('heading', { name: "Qu'est-ce que la maladie de Crohn ?" })).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent("ne remplace pas l'avis de votre médecin");
  });

  it('un clic sur un onglet affiche son contenu et le marque sélectionné', async () => {
    renderScreen();
    await userEvent.click(tab('Symptômes'));

    expect(tab('Symptômes')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Comprendre')).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('heading', { name: 'Symptômes digestifs' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: "Qu'est-ce que la maladie de Crohn ?" })).toBeNull();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Symptômes');
  });

  it('l’encart d’urgence n’apparaît que sur l’onglet « Symptômes »', async () => {
    renderScreen();
    expect(screen.queryByRole('heading', { name: EMERGENCY })).toBeNull();

    await userEvent.click(tab('Symptômes'));
    expect(screen.getByRole('heading', { name: EMERGENCY })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /190/ })).toHaveAttribute('href', 'tel:190');

    for (const other of ['Traitements', 'Vivre avec', 'Comprendre']) {
      await userEvent.click(tab(other));
      expect(screen.queryByRole('heading', { name: EMERGENCY })).toBeNull();
    }
  });

  describe('navigation au clavier', () => {
    it('en LTR, ArrowRight active l’onglet suivant et ArrowLeft le précédent', async () => {
      renderScreen();
      tab('Comprendre').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(tab('Symptômes')).toHaveAttribute('aria-selected', 'true');
      expect(tab('Symptômes')).toHaveFocus();

      await userEvent.keyboard('{ArrowLeft}');
      expect(tab('Comprendre')).toHaveAttribute('aria-selected', 'true');
    });

    it('en RTL, ArrowRight active l’onglet précédent (et boucle sur le dernier)', async () => {
      document.documentElement.dir = 'rtl';
      renderScreen();
      tab('Comprendre').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(tab('Vivre avec')).toHaveAttribute('aria-selected', 'true');

      await userEvent.keyboard('{ArrowLeft}');
      expect(tab('Comprendre')).toHaveAttribute('aria-selected', 'true');
    });

    it('Fin va au dernier onglet et Début au premier', async () => {
      renderScreen();
      tab('Comprendre').focus();

      await userEvent.keyboard('{End}');
      expect(tab('Vivre avec')).toHaveAttribute('aria-selected', 'true');
      expect(tab('Vivre avec')).toHaveFocus();

      await userEvent.keyboard('{Home}');
      expect(tab('Comprendre')).toHaveAttribute('aria-selected', 'true');
    });

    it('seul l’onglet actif est dans l’ordre de tabulation', () => {
      renderScreen();
      expect(tab('Comprendre')).toHaveAttribute('tabindex', '0');
      expect(tab('Symptômes')).toHaveAttribute('tabindex', '-1');
    });
  });

  describe.each([
    ['Cycle féminin et maladie de Crohn', 'Pendant les règles'],
    ['Arrêter le tabac : une priorité', "Pourquoi c'est important"],
  ])('accordéon « %s »', (title, inner) => {
    it('s’ouvre et se ferme', async () => {
      renderScreen();
      const button = screen.getByRole('button', { name: title });

      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(inner)).toBeNull();

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByRole('region', { name: title })).toHaveTextContent(inner);

      await userEvent.click(button);
      expect(button).toHaveAttribute('aria-expanded', 'false');
      expect(screen.queryByText(inner)).toBeNull();
    });
  });
});

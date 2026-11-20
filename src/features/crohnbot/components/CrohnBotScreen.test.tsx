import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import CrohnBotScreen from './CrohnBotScreen';
import { askCrohnBot } from '../api';

vi.mock('../api', () => ({ askCrohnBot: vi.fn() }));
const ask = vi.mocked(askCrohnBot);

const renderBot = () =>
  render(
    <MemoryRouter>
      <CrohnBotScreen />
    </MemoryRouter>,
  );

describe('<CrohnBotScreen />', () => {
  beforeEach(() => ask.mockReset());

  it("affiche l'avertissement permanent", () => {
    renderBot();
    expect(screen.getByRole('note')).toHaveTextContent('ne remplace pas un avis médical');
  });

  it('envoie la conversation et affiche la réponse', async () => {
    ask.mockResolvedValue({ kind: 'reply', text: 'Réponse du bot', remaining: 29, truncated: false });
    renderBot();
    await userEvent.type(screen.getByLabelText('Écrivez votre question…'), 'Bonjour');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(ask).toHaveBeenCalledWith([{ role: 'user', content: 'Bonjour' }], 'fr');
    expect(await screen.findByText('Réponse du bot')).toBeInTheDocument();
    expect(screen.getByText('29 messages restants aujourd’hui')).toBeInTheDocument();
  });

  it('bloque la saisie quand la limite quotidienne est atteinte', async () => {
    ask.mockResolvedValue({ kind: 'error', reason: 'daily_limit' });
    renderBot();
    await userEvent.click(screen.getByRole('button', { name: /fatigue/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('limite de 30 messages');
    expect(screen.getByLabelText('Écrivez votre question…')).toBeDisabled();
  });
});

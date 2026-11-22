import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PseudonymSetup } from './PseudonymSetup';
import { createPseudonym } from '../api';

vi.mock('../api', () => ({ createPseudonym: vi.fn() }));
const createPseudonymMock = vi.mocked(createPseudonym);

describe('<PseudonymSetup />', () => {
  beforeEach(() => createPseudonymMock.mockReset());

  it('impose 3 à 30 caractères sur le champ', () => {
    render(<PseudonymSetup onDone={vi.fn()} />);
    const input = screen.getByLabelText('Pseudonyme');
    expect(input).toHaveAttribute('minLength', '3');
    expect(input).toHaveAttribute('maxLength', '30');
    expect(input).toBeRequired();
  });

  it('un enregistrement réussi appelle onDone', async () => {
    createPseudonymMock.mockResolvedValueOnce('ok');
    const onDone = vi.fn();
    render(<PseudonymSetup onDone={onDone} />);
    await userEvent.type(screen.getByLabelText('Pseudonyme'), 'Jasmin');
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(createPseudonymMock).toHaveBeenCalledWith('Jasmin');
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('un pseudonyme déjà pris affiche le message dédié, sans appeler onDone', async () => {
    createPseudonymMock.mockResolvedValueOnce('taken');
    const onDone = vi.fn();
    render(<PseudonymSetup onDone={onDone} />);
    await userEvent.type(screen.getByLabelText('Pseudonyme'), 'Jasmin');
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ce pseudonyme est déjà pris.');
    expect(onDone).not.toHaveBeenCalled();
  });

  it("un échec d'enregistrement affiche le message d'erreur", async () => {
    createPseudonymMock.mockRejectedValueOnce(new Error('réseau'));
    const onDone = vi.fn();
    render(<PseudonymSetup onDone={onDone} />);
    await userEvent.type(screen.getByLabelText('Pseudonyme'), 'Jasmin');
    await userEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue.');
    expect(onDone).not.toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReportForm } from './ReportForm';
import { report } from '../api';

vi.mock('../api', () => ({ report: vi.fn() }));
const reportMock = vi.mocked(report);

describe('<ReportForm />', () => {
  beforeEach(() => reportMock.mockReset());

  it('le motif « Information médicale dangereuse ou fausse » est sélectionné au départ', () => {
    render(<ReportForm target={{ postId: 'p1' }} onClose={vi.fn()} />);
    expect(screen.getByRole('radio', { name: 'Information médicale dangereuse ou fausse' })).toBeChecked();
    expect(screen.getAllByRole('radio')).toHaveLength(5);
  });

  it('envoie la cible, le motif choisi et les précisions saisies', async () => {
    reportMock.mockResolvedValueOnce('ok');
    render(<ReportForm target={{ commentId: 'c9' }} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Publicité ou spam' }));
    await userEvent.type(screen.getByLabelText('Précisions (facultatif)'), 'Lien commercial');
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));
    expect(reportMock).toHaveBeenCalledWith({ commentId: 'c9' }, 'spam', 'Lien commercial');
    expect(await screen.findByRole('status')).toHaveTextContent('Merci, votre signalement a été transmis.');
  });

  it('un signalement en double affiche « déjà signalé »', async () => {
    reportMock.mockResolvedValueOnce('already');
    render(<ReportForm target={{ postId: 'p1' }} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Vous avez déjà signalé ce message.');
  });

  it("un échec affiche le message d'erreur", async () => {
    reportMock.mockRejectedValueOnce(new Error('réseau'));
    render(<ReportForm target={{ postId: 'p1' }} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer le signalement' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Une erreur est survenue.');
  });

  it('« Annuler » ferme le formulaire sans signaler', async () => {
    const onClose = vi.fn();
    render(<ReportForm target={{ postId: 'p1' }} onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(reportMock).not.toHaveBeenCalled();
  });
});

// Paramètres : section Confidentialité selon le rôle, langue, notifications, suppressions confirmées.
// L'export a son propre fichier (SettingsExport.test.tsx).
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from './Settings';
import * as api from '../api';
import { applyLanguage } from '@/i18n';

const auth = vi.hoisted(() => ({
  role: 'patient' as 'patient' | 'doctor',
  refreshProfile: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    profile: {
      id: 'p1',
      role: auth.role,
      first_name: 'Amina',
      last_name: 'B',
      language: 'fr',
      notif_meds: false,
      notif_community: false,
      notif_tips: false,
    },
    refreshProfile: auth.refreshProfile,
    signOut: auth.signOut,
  }),
}));
vi.mock('@/features/rappels/notifications', () => ({
  checkPermission: () => Promise.resolve('granted'),
  remindersSupported: () => false,
  requestPermission: () => Promise.resolve('granted'),
}));
vi.mock('../api', () => ({
  updateProfile: vi.fn(),
  exportMyData: vi.fn(),
  deleteJournals: vi.fn(),
  deleteMyAccount: vi.fn(),
}));
// La langue de l'interface ne doit pas changer pour les autres tests : on garde le vrai module sauf applyLanguage.
vi.mock('@/i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/i18n')>()),
  applyLanguage: vi.fn(),
}));

beforeEach(() => {
  auth.role = 'patient';
  vi.clearAllMocks();
});

describe('<Settings /> — rôle', () => {
  it('patient : la section Confidentialité est visible', async () => {
    render(<Settings />);
    expect(await screen.findByRole('heading', { name: 'Confidentialité' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Supprimer le compte' })).toBeInTheDocument();
  });

  it('médecin : la section Confidentialité est absente', async () => {
    auth.role = 'doctor';
    render(<Settings />);
    expect(await screen.findByRole('heading', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Confidentialité' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Supprimer le compte' })).not.toBeInTheDocument();
  });
});

describe('<Settings /> — préférences', () => {
  it('changer de langue applique la langue et met à jour le profil avec son code', async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(applyLanguage).toHaveBeenCalledWith('en');
    expect(api.updateProfile).toHaveBeenCalledWith('p1', { language: 'en' });
  });

  it.each([
    ['Rappels médicamenteux', 'notif_meds'],
    ['Activité de la communauté', 'notif_community'],
    ['Conseils du jour', 'notif_tips'],
  ])('la case « %s » met à jour le champ %s', async (label, field) => {
    render(<Settings />);
    await userEvent.click(screen.getByRole('checkbox', { name: label }));
    expect(api.updateProfile).toHaveBeenCalledWith('p1', { [field]: true });
  });
});

describe('<Settings /> — suppressions confirmées', () => {
  it('« Supprimer le journal » : annuler ne supprime rien, confirmer appelle deleteJournals', async () => {
    render(<Settings />);
    const open = screen.getByRole('button', { name: 'Supprimer le journal et les symptômes' });

    await userEvent.click(open);
    let dialog = screen.getByRole('alertdialog', { name: 'Supprimer le journal et les symptômes' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(api.deleteJournals).not.toHaveBeenCalled();

    await userEvent.click(open);
    dialog = screen.getByRole('alertdialog', { name: 'Supprimer le journal et les symptômes' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer' }));
    expect(api.deleteJournals).toHaveBeenCalledWith('p1');
    expect(await screen.findByRole('status')).toHaveTextContent('Journal et symptômes supprimés.');
  });

  it('« Supprimer le compte » : annuler ne supprime rien', async () => {
    render(<Settings />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer le compte' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Supprimer mon compte' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }));
    expect(api.deleteMyAccount).not.toHaveBeenCalled();
    expect(auth.signOut).not.toHaveBeenCalled();
  });

  it('« Supprimer le compte » confirmé et réussi : déconnexion', async () => {
    vi.mocked(api.deleteMyAccount).mockResolvedValueOnce(true);
    render(<Settings />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer le compte' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Supprimer mon compte' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer le compte' }));
    expect(api.deleteMyAccount).toHaveBeenCalledTimes(1);
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  it('« Supprimer le compte » confirmé mais échoué : pas de déconnexion', async () => {
    vi.mocked(api.deleteMyAccount).mockResolvedValueOnce(false);
    render(<Settings />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer le compte' }));
    const dialog = screen.getByRole('alertdialog', { name: 'Supprimer mon compte' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Supprimer le compte' }));
    expect(api.deleteMyAccount).toHaveBeenCalledTimes(1);
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

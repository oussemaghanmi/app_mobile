// Paramètres (#101) : le bouton de langue mis en évidence et annoncé (aria-pressed) est celui de la langue
// réellement affichée par l'interface, même si profiles.language contient autre chose.
import { act, render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import Settings from './Settings';

vi.mock('@/features/auth/AuthProvider', () => ({
  useAuth: () => ({
    profile: {
      id: 'p1',
      role: 'patient',
      first_name: 'Amina',
      last_name: 'B',
      language: 'fr', // profil resté sur la valeur par défaut
      notif_meds: false,
      notif_community: false,
      notif_tips: false,
    },
    refreshProfile: vi.fn(),
    signOut: vi.fn(),
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

afterEach(async () => {
  await act(() => i18n.changeLanguage('fr'));
});

describe('<Settings /> — langue active', () => {
  it('interface en arabe, profil en français : « العربية » est la langue active', async () => {
    await act(() => i18n.changeLanguage('ar'));
    render(<Settings />);
    expect(await screen.findByRole('button', { name: 'العربية' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'false');
  });

  it("suit un changement de langue de l'interface sans recharger l'écran", async () => {
    render(<Settings />);
    expect(await screen.findByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'true');
    await act(() => i18n.changeLanguage('en'));
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Français' })).toHaveAttribute('aria-pressed', 'false');
  });
});

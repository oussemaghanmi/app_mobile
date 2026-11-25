// Réception du lien de réinitialisation dans l'APK (#88) : la session de récupération est ouverte,
// puis l'écran « Nouveau mot de passe » s'affiche. Sur le web, rien n'est écouté.
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useRecoveryDeepLink } from './useRecoveryDeepLink';
import { completeRecoveryFromLink } from './api';

const native = vi.hoisted(() => ({ value: true, listener: null as null | ((e: { url: string }) => void) }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.value } }));
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn((_event: string, cb: (e: { url: string }) => void) => {
      native.listener = cb;
      return Promise.resolve({ remove: vi.fn() });
    }),
  },
}));
vi.mock('./api', () => ({ completeRecoveryFromLink: vi.fn(() => Promise.resolve(true)) }));

function Harness() {
  useRecoveryDeepLink();
  return (
    <Routes>
      <Route path="/login" element={<p>écran de connexion</p>} />
      <Route path="/reset-password" element={<p>nouveau mot de passe</p>} />
    </Routes>
  );
}
const renderAt = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Harness />
    </MemoryRouter>,
  );

beforeEach(() => {
  native.value = true;
  native.listener = null;
  vi.mocked(completeRecoveryFromLink).mockClear();
});

describe('useRecoveryDeepLink()', () => {
  it('ouvre la session puis affiche l’écran de nouveau mot de passe', async () => {
    renderAt();
    await act(async () => {
      native.listener?.({
        url: 'tn.croncare.app://reset-password#access_token=AT&refresh_token=RT&type=recovery',
      });
    });
    expect(completeRecoveryFromLink).toHaveBeenCalledWith({
      kind: 'tokens',
      accessToken: 'AT',
      refreshToken: 'RT',
    });
    expect(await screen.findByText('nouveau mot de passe')).toBeInTheDocument();
  });

  it('lien expiré : affiche l’écran avec l’erreur, sans ouvrir de session', async () => {
    renderAt();
    await act(async () => {
      native.listener?.({
        url: 'tn.croncare.app://reset-password#error=access_denied&error_code=otp_expired',
      });
    });
    expect(completeRecoveryFromLink).not.toHaveBeenCalled();
    expect(await screen.findByText('nouveau mot de passe')).toBeInTheDocument();
  });

  it('ignore les autres liens', async () => {
    renderAt();
    await act(async () => {
      native.listener?.({ url: 'tn.croncare.app://autre-chose' });
    });
    expect(completeRecoveryFromLink).not.toHaveBeenCalled();
    expect(screen.getByText('écran de connexion')).toBeInTheDocument();
  });

  it("sur le web, n'écoute rien", () => {
    native.value = false;
    renderAt();
    expect(native.listener).toBeNull();
  });
});

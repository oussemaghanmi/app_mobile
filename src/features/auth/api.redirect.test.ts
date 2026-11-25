// URL de redirection de « Mot de passe oublié » (#88) : l'application Android reçoit un lien vers elle-même.
const native = vi.hoisted(() => ({ value: false }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => native.value } }));
vi.mock('@/lib/supabase', () => ({ supabase: {} }));

import { getResetPasswordRedirectUrl } from './api';

describe('getResetPasswordRedirectUrl()', () => {
  afterEach(() => {
    native.value = false;
    vi.unstubAllEnvs();
  });

  it("dans l'APK : lien vers l'application, même si VITE_SITE_URL est défini", () => {
    native.value = true;
    vi.stubEnv('VITE_SITE_URL', 'https://croncare.example');
    expect(getResetPasswordRedirectUrl()).toBe('tn.croncare.app://reset-password');
  });

  it('sur le web : VITE_SITE_URL si défini', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://croncare.example/');
    expect(getResetPasswordRedirectUrl()).toBe('https://croncare.example/reset-password');
  });

  it("sur le web sans VITE_SITE_URL : l'origine de la page", () => {
    vi.stubEnv('VITE_SITE_URL', '');
    expect(getResetPasswordRedirectUrl()).toBe(`${window.location.origin}/reset-password`);
  });
});

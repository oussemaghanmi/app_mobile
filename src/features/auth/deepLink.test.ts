import { APP_RESET_URL, parseRecoveryLink } from './deepLink';

describe('parseRecoveryLink() (#88)', () => {
  it("l'URL de l'application utilise l'identifiant Android comme schéma", () => {
    expect(APP_RESET_URL).toBe('tn.croncare.app://reset-password');
  });

  it('flux implicite : jetons dans le fragment', () => {
    expect(
      parseRecoveryLink(
        'tn.croncare.app://reset-password#access_token=AT&expires_in=3600&refresh_token=RT&token_type=bearer&type=recovery',
      ),
    ).toEqual({ kind: 'tokens', accessToken: 'AT', refreshToken: 'RT' });
  });

  it('flux PKCE : code dans la requête', () => {
    expect(parseRecoveryLink('tn.croncare.app://reset-password?code=abc123')).toEqual({
      kind: 'code',
      code: 'abc123',
    });
  });

  it('lien expiré : erreur transmise telle quelle', () => {
    expect(
      parseRecoveryLink(
        'tn.croncare.app://reset-password#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid',
      ),
    ).toEqual({
      kind: 'error',
      fragment: 'error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid',
    });
  });

  it.each([
    ['autre écran de l’application', 'tn.croncare.app://autre#access_token=AT&refresh_token=RT'],
    ['autre schéma', 'https://exemple.tn/reset-password#access_token=AT&refresh_token=RT'],
    ['jeton incomplet', 'tn.croncare.app://reset-password#access_token=AT'],
    ['URL illisible', 'pas une url'],
  ])('ignore : %s', (_cas, url) => {
    expect(parseRecoveryLink(url)).toBeNull();
  });
});

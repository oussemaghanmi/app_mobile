import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({ supabase: {} }));

import { authErrorKey } from './api';

describe('authErrorKey', () => {
  it.each([
    [{ name: 'AuthApiError', code: 'user_already_exists' }, 'auth.errors.alreadyRegistered'],
    [{ name: 'AuthWeakPasswordError', code: 'weak_password' }, 'auth.passwordTooShort'],
    [{ name: 'AuthApiError', code: 'validation_failed' }, 'auth.errors.invalidEmail'],
    [{ name: 'AuthApiError', code: 'over_email_send_rate_limit' }, 'auth.errors.rateLimited'],
    [{ name: 'AuthSessionMissingError', code: undefined }, 'auth.errors.linkExpired'],
    [{ name: 'AuthApiError', code: 'otp_expired' }, 'auth.errors.linkExpired'],
    [{ name: 'AuthApiError', code: 'access_denied' }, 'auth.errors.linkExpired'],
    ['otp_expired', 'auth.errors.linkExpired'],
    ['access_denied', 'auth.errors.linkExpired'],
    ['user_already_exists', 'auth.errors.alreadyRegistered'],
    ['over_email_send_rate_limit', 'auth.errors.rateLimited'],
    [{ name: 'AuthApiError', code: 'quelque_chose_d_inconnu' }, 'auth.genericError'],
  ])('%j -> %s', (error, key) => {
    expect(authErrorKey(error as Parameters<typeof authErrorKey>[0])).toBe(key);
  });
});

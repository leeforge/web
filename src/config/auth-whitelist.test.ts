import { describe, expect, it } from 'bun:test';
import { AUTH_WHITELIST, isAuthWhitelistedPath } from './auth-whitelist';

describe('auth whitelist', () => {
  it('includes password reset public route', () => {
    expect(AUTH_WHITELIST).toContain('/password/reset');
    expect(isAuthWhitelistedPath('/password/reset')).toBe(true);
  });

  it('keeps dashboard route protected', () => {
    expect(isAuthWhitelistedPath('/_dashboard/users/')).toBe(false);
  });
});

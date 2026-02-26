import { describe, expect, it } from 'bun:test';
import {
  buildResetIdentityText,
  buildResetPasswordPayload,
  extractResetTokenFromSearch,
} from './reset.helpers';

describe('password reset helpers', () => {
  it('extracts token from token/resetToken/resetJwt and trims spaces', () => {
    expect(extractResetTokenFromSearch({ token: '  t-1  ' })).toBe('t-1');
    expect(extractResetTokenFromSearch({ resetToken: 't-2' })).toBe('t-2');
    expect(extractResetTokenFromSearch({ resetJwt: 't-3' })).toBe('t-3');
    expect(extractResetTokenFromSearch({})).toBe('');
  });

  it('builds reset password submit payload', () => {
    expect(buildResetPasswordPayload('  t-1  ', {
      password: 'password-123',
      confirmPassword: 'password-123',
    })).toEqual({
      resetJwt: 't-1',
      password: 'password-123',
      confirmPassword: 'password-123',
    });
  });

  it('builds identity text fallback', () => {
    expect(buildResetIdentityText('alice', 'alice@example.com')).toContain('alice@example.com');
    expect(buildResetIdentityText('', '')).toBe('请输入新密码完成重置');
  });
});

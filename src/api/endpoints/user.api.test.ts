import { describe, expect, it } from 'bun:test';
import {
  CreatePasswordResetResponseSchema,
  ResetPasswordByTokenParamsSchema,
  ValidateResetPasswordTokenResponseSchema,
  normalizePublicToken,
} from './user.api';

describe('user api reset-password contract', () => {
  it('normalizes token query value', () => {
    expect(normalizePublicToken('  reset-token  ')).toBe('reset-token');
  });

  it('parses validate reset token response', () => {
    const parsed = ValidateResetPasswordTokenResponseSchema.parse({
      valid: true,
      userId: 'user-1',
      email: 'alice@example.com',
      expiresAt: '2026-02-20T08:00:00Z',
    });
    expect(parsed.valid).toBe(true);
    expect(parsed.userId).toBe('user-1');
    expect(parsed.email).toBe('alice@example.com');
  });

  it('parses create password reset response', () => {
    const parsed = CreatePasswordResetResponseSchema.parse({
      id: 'reset-1',
      resetJwt: 'jwt-1',
      email: 'alice@example.com',
      expiresAt: '2026-02-20T08:00:00Z',
    });
    expect(parsed.resetJwt).toBe('jwt-1');
  });

  it('rejects mismatch passwords in reset payload', () => {
    expect(() =>
      ResetPasswordByTokenParamsSchema.parse({
        resetJwt: 'reset-token',
        password: 'password-123',
        confirmPassword: 'password-456',
      }),
    ).toThrow('两次密码输入不一致');
  });
});

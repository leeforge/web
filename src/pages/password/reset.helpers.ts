import type { ResetPasswordByTokenParams } from '@/api/endpoints/user.api';

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export function extractResetTokenFromSearch(search: Record<string, unknown>): string {
  const candidates = [search.resetJwt, search.token, search.resetToken];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

export function buildResetPasswordPayload(
  token: string,
  values: ResetPasswordFormValues,
): ResetPasswordByTokenParams {
  return {
    resetJwt: token.trim(),
    password: values.password,
    confirmPassword: values.confirmPassword,
  };
}

export function buildResetIdentityText(userId?: string, email?: string): string {
  if (email) {
    return `用户：${userId || '-'}，邮箱：${email}`;
  }
  return '请输入新密码完成重置';
}

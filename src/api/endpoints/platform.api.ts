import { z } from 'zod';
import { http } from '../client';

export const SwitchTenantParamsSchema = z.object({
  targetTenantId: z.string().min(1, '目标租户不能为空'),
  reason: z.string().min(1, '切换原因不能为空'),
  durationMinutes: z.number().int().min(1, '切换时长必须大于 0'),
});
export type SwitchTenantParams = z.infer<typeof SwitchTenantParamsSchema>;

export const SwitchTenantDataSchema = z.object({
  token: z.string(),
  targetTenantId: z.string(),
  expiresAt: z.string(),
  durationMinutes: z.number().int().optional(),
});
export type SwitchTenantData = z.infer<typeof SwitchTenantDataSchema>;

/**
 * 平台切租户（生成短期代管 Token）
 * 强制使用普通会话 Token，不复用代管态 Token。
 */
export function switchTenant(params: SwitchTenantParams) {
  return http.post<SwitchTenantData>('/platform/switch-tenant', params, {
    skipImpersonation: true,
  });
}

export function startImpersonation(params: SwitchTenantParams) {
  return switchTenant(params);
}

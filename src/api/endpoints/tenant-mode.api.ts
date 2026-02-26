import { z } from 'zod';
import { unsupportedGovernanceApi } from './governance-contract.api';

export const TenantModeSchema = z.object({
  multiTenancyEnabled: z.boolean(),
  defaultDomainType: z.string().optional(),
  defaultDomainKey: z.string().optional(),
  updatedAt: z.string().optional(),
  updatedBy: z.string().optional(),
});
export type TenantMode = z.infer<typeof TenantModeSchema>;

export const UpdateTenantModeParamsSchema = z.object({
  multiTenancyEnabled: z.boolean(),
  defaultDomainType: z.string().optional(),
  defaultDomainKey: z.string().optional(),
});
export type UpdateTenantModeParams = z.infer<typeof UpdateTenantModeParamsSchema>;

export function getTenantModeConfig() {
  return unsupportedGovernanceApi<TenantMode>('tenant-mode');
}

export function updateTenantModeConfig(_params: UpdateTenantModeParams) {
  return unsupportedGovernanceApi<TenantMode>('tenant-mode');
}

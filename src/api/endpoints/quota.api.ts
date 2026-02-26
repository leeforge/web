import type { PaginatedResponse } from '../types';
import { z } from 'zod';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';
import { unsupportedGovernanceApi } from './governance-contract.api';

export const QuotaSchema = BaseEntitySchema.extend({
  scopeType: z.enum(['tenant', 'project']),
  scopeId: z.string(),
  maxUsers: z.number().int().min(0).optional(),
  maxProjects: z.number().int().min(0).optional(),
  maxStorageBytes: z.number().min(0).optional(),
  maxApiPerDay: z.number().int().min(0).optional(),
});
export type Quota = z.infer<typeof QuotaSchema>;

export const UsageCounterSchema = z.object({
  scopeType: z.enum(['tenant', 'project']),
  scopeId: z.string(),
  metric: z.string(),
  value: z.number().min(0),
  window: z.string(),
});
export type UsageCounter = z.infer<typeof UsageCounterSchema>;

export const QuotaListParamsSchema = PaginationParamsSchema.extend({
  scopeType: z.enum(['tenant', 'project']).optional(),
  scopeId: z.string().optional(),
});
export type QuotaListParams = z.infer<typeof QuotaListParamsSchema>;

export const UpdateQuotaParamsSchema = z.object({
  maxUsers: z.number().int().min(0).optional(),
  maxProjects: z.number().int().min(0).optional(),
  maxStorageBytes: z.number().min(0).optional(),
  maxApiPerDay: z.number().int().min(0).optional(),
});
export type UpdateQuotaParams = z.infer<typeof UpdateQuotaParamsSchema>;

export function getQuotaList(_params?: QuotaListParams) {
  return unsupportedGovernanceApi<PaginatedResponse<Quota>>('quota');
}

export function updateQuota(_id: string, _params: UpdateQuotaParams) {
  return unsupportedGovernanceApi<Quota>('quota');
}

export function getUsageCounters(_scopeType: 'tenant' | 'project', _scopeId: string) {
  return unsupportedGovernanceApi<UsageCounter[]>('quota');
}


import type { PaginatedResponse } from '../types';
import { z } from 'zod';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';
import { unsupportedGovernanceApi } from './governance-contract.api';

export const ShareGrantSchema = BaseEntitySchema.extend({
  sourceDomainType: z.string().optional(),
  sourceDomainKey: z.string().optional(),
  sourceProjectId: z.string().nullable().optional(),
  targetDomainType: z.string().optional(),
  targetDomainKey: z.string().optional(),
  targetProjectId: z.string().nullable().optional(),
  resourceType: z.string(),
  resourceId: z.string(),
  accessLevel: z.enum(['read', 'fork', 'sync']),
  status: z.enum(['active', 'inactive']),
});
export type ShareGrant = z.infer<typeof ShareGrantSchema>;

export const ShareGrantListParamsSchema = PaginationParamsSchema.extend({
  sourceDomainType: z.string().optional(),
  sourceDomainKey: z.string().optional(),
  targetDomainType: z.string().optional(),
  targetDomainKey: z.string().optional(),
  accessLevel: z.enum(['read', 'fork', 'sync']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type ShareGrantListParams = z.infer<typeof ShareGrantListParamsSchema>;

export const CreateShareGrantParamsSchema = z.object({
  sourceDomainType: z.string().min(1, '来源域类型不能为空'),
  sourceDomainKey: z.string().min(1, '来源域标识不能为空'),
  sourceProjectId: z.string().optional(),
  targetDomainType: z.string().min(1, '目标域类型不能为空'),
  targetDomainKey: z.string().min(1, '目标域标识不能为空'),
  targetProjectId: z.string().optional(),
  resourceType: z.string().min(1, '资源类型不能为空'),
  resourceId: z.string().min(1, '资源 ID 不能为空'),
  accessLevel: z.enum(['read', 'fork', 'sync']),
});
export type CreateShareGrantParams = z.infer<typeof CreateShareGrantParamsSchema>;

export function getShareGrantList(_params?: ShareGrantListParams) {
  return unsupportedGovernanceApi<PaginatedResponse<ShareGrant>>('share-grant');
}

export function createShareGrant(_params: CreateShareGrantParams) {
  return unsupportedGovernanceApi<ShareGrant>('share-grant');
}

export function revokeShareGrant(_id: string) {
  return unsupportedGovernanceApi<void>('share-grant');
}

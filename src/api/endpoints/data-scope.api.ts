import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';

export const LegacyScopeTypeSchema = z.enum([
  'TENANT_ALL',
  'SELF',
  'OU_SELF',
  'OU_SUBTREE',
  'OU_LIST',
]);
export type LegacyScopeType = z.infer<typeof LegacyScopeTypeSchema>;

export const ScopeTypeSchema = z.enum([
  'TENANT',
  'PROJECT',
  'SELF',
  'ORG_NODE',
  'ORG_SUBTREE',
  'ORG_LIST',
]);
export type ScopeType = z.infer<typeof ScopeTypeSchema>;
export type ScopeTypeLike = ScopeType | LegacyScopeType;

export const RoleRuleScopeTypeSchema = z.enum(['ALL', 'SELF', 'OU_SELF', 'OU_SUBTREE']);
export type RoleRuleScopeType = z.infer<typeof RoleRuleScopeTypeSchema>;

const ROLE_RULE_SCOPE_TO_BACKEND_MAP: Record<RoleRuleScopeType, RoleRuleScopeType> = {
  ALL: 'ALL',
  SELF: 'SELF',
  OU_SELF: 'OU_SELF',
  OU_SUBTREE: 'OU_SUBTREE',
};

const LEGACY_SCOPE_TYPE_MAP: Record<LegacyScopeType, ScopeType> = {
  TENANT_ALL: 'TENANT',
  SELF: 'SELF',
  OU_SELF: 'ORG_NODE',
  OU_SUBTREE: 'ORG_SUBTREE',
  OU_LIST: 'ORG_LIST',
};

const SCOPE_TYPE_TO_BACKEND_MAP: Record<ScopeType, ScopeTypeLike> = {
  TENANT: 'TENANT_ALL',
  PROJECT: 'PROJECT',
  SELF: 'SELF',
  ORG_NODE: 'OU_SELF',
  ORG_SUBTREE: 'OU_SUBTREE',
  ORG_LIST: 'OU_LIST',
};

export const ScopeTypeLabels: Record<ScopeType, string> = {
  TENANT: '租户全部数据',
  PROJECT: '当前项目数据',
  SELF: '仅本人数据',
  ORG_NODE: '当前组织数据',
  ORG_SUBTREE: '当前组织及下级数据',
  ORG_LIST: '指定组织集数据',
};

export const ScopeTypePriority: Record<ScopeType, number> = {
  TENANT: 6,
  PROJECT: 5,
  ORG_SUBTREE: 4,
  ORG_NODE: 3,
  ORG_LIST: 2,
  SELF: 1,
};

export function normalizeScopeType(scopeType: ScopeTypeLike): ScopeType {
  if (ScopeTypeSchema.options.includes(scopeType as ScopeType)) {
    return scopeType as ScopeType;
  }
  return LEGACY_SCOPE_TYPE_MAP[scopeType as LegacyScopeType] || 'SELF';
}

export function toBackendScopeType(scopeType: ScopeType): ScopeTypeLike {
  return SCOPE_TYPE_TO_BACKEND_MAP[scopeType];
}

export const DataScopePolicySchema = BaseEntitySchema.extend({
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  roleCode: z.string(),
  resourceKey: z.string(),
  scopeType: z.union([ScopeTypeSchema, LegacyScopeTypeSchema]),
  scopeValue: z.string().nullable().optional(),
});
export type DataScopePolicy = z.infer<typeof DataScopePolicySchema>;

export const CreateDataScopePolicyParamsSchema = z.object({
  roleCode: z.string(),
  resourceKey: z.string(),
  scopeType: ScopeTypeSchema,
  scopeValue: z.string().nullable().optional(),
});
export type CreateDataScopePolicyParams = z.infer<typeof CreateDataScopePolicyParamsSchema>;

export const UpdateDataScopePolicyParamsSchema = z.object({
  roleCode: z.string().optional(),
  resourceKey: z.string().optional(),
  scopeType: ScopeTypeSchema.optional(),
  scopeValue: z.string().nullable().optional(),
});
export type UpdateDataScopePolicyParams = z.infer<typeof UpdateDataScopePolicyParamsSchema>;

export const DataScopePolicyListParamsSchema = PaginationParamsSchema.extend({
  roleCode: z.string().optional(),
  resourceKey: z.string().optional(),
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
});
export type DataScopePolicyListParams = z.infer<typeof DataScopePolicyListParamsSchema>;
export type ListPoliciesParams = DataScopePolicyListParams;

export const DataScopePolicyListResultSchema = z.object({
  items: z.array(DataScopePolicySchema).optional(),
  page: z.number().int().optional(),
  pageSize: z.number().int().optional(),
  total: z.number().int().optional(),
  totalPages: z.number().int().optional(),
});
export type DataScopePolicyListResult = z.infer<typeof DataScopePolicyListResultSchema>;
export type CreatePolicyParams = CreateDataScopePolicyParams;
export type UpdatePolicyParams = UpdateDataScopePolicyParams;

export const OrganizationListSchema = z.object({
  id: z.string(),
  name: z.string(),
  organizationIds: z.array(z.string()),
});
export type OrganizationList = z.infer<typeof OrganizationListSchema>;

export interface ResourceKeyOption {
  key: string;
  label: string;
  description?: string;
}

export const ResourceKeys: ResourceKeyOption[] = [
  { key: 'sys:user', label: '用户管理', description: '系统用户数据' },
  { key: 'sys:role', label: '角色管理', description: '系统角色数据' },
  { key: 'cms.schema', label: '模型管理', description: 'CMS 模型定义数据' },
  { key: 'cms.entry', label: '内容条目', description: 'CMS 内容条目数据' },
  { key: 'cms.media', label: '媒体资源', description: 'CMS 媒体文件数据' },
  { key: 'cms.workflow', label: '工作流', description: 'CMS 审批与发布流程数据' },
  { key: 'cms.setting', label: 'CMS 设置', description: 'CMS 业务配置数据' },
];

export const RoleDataScopeRuleSchema = z.object({
  id: z.string().optional(),
  domain: z.string(),
  resourceKey: z.string(),
  scopeType: RoleRuleScopeTypeSchema,
  scopeValue: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type RoleDataScopeRule = z.infer<typeof RoleDataScopeRuleSchema>;

export const UpsertRoleDataScopeRuleParamsSchema = z.object({
  domain: z.string().min(1),
  resourceKey: z.string().min(1),
  scopeType: RoleRuleScopeTypeSchema,
  scopeValue: z.string().optional().nullable(),
});
export type UpsertRoleDataScopeRuleParams = z.infer<typeof UpsertRoleDataScopeRuleParamsSchema>;

export function toLegacyRoleRuleScopeType(scopeType: RoleRuleScopeType): RoleRuleScopeType {
  return ROLE_RULE_SCOPE_TO_BACKEND_MAP[scopeType];
}

/**
 * 获取角色的数据范围配置
 */
export function getDataScopePolicies(params?: DataScopePolicyListParams) {
  return http.get<DataScopePolicyListResult | DataScopePolicy[]>('/data-scope-policies', { params });
}

export function listRoleDataScopeRules(roleId: string) {
  return http.get<RoleDataScopeRule[]>(`/roles/${roleId}/data-scope-rules`);
}

export function upsertRoleDataScopeRule(roleId: string, params: UpsertRoleDataScopeRuleParams) {
  return http.put<RoleDataScopeRule>(`/roles/${roleId}/data-scope-rules`, {
    ...params,
    scopeType: toLegacyRoleRuleScopeType(params.scopeType),
  });
}

export function deleteRoleDataScopeRule(
  roleId: string,
  params: { domain: string; resourceKey: string },
) {
  return http.delete<void>(`/roles/${roleId}/data-scope-rules`, { data: params });
}

export function listPolicies(params?: ListPoliciesParams) {
  return getDataScopePolicies(params);
}

/**
 * 获取单个策略
 */
export function getDataScopePolicyById(id: string) {
  return http.get<DataScopePolicy>(`/data-scope-policies/${id}`);
}

/**
 * 创建策略
 */
export function createDataScopePolicy(params: CreateDataScopePolicyParams) {
  return http.post<DataScopePolicy>('/data-scope-policies', {
    ...params,
    scopeType: toBackendScopeType(params.scopeType),
  });
}

export function createPolicy(params: CreatePolicyParams) {
  return createDataScopePolicy(params);
}

/**
 * 更新策略
 */
export function updateDataScopePolicy(id: string, params: UpdateDataScopePolicyParams) {
  return http.put<DataScopePolicy>(`/data-scope-policies/${id}`, {
    ...params,
    scopeType: params.scopeType ? toBackendScopeType(params.scopeType) : params.scopeType,
  });
}

export function updatePolicy(id: string, params: UpdatePolicyParams) {
  return updateDataScopePolicy(id, params);
}

/**
 * 删除策略
 */
export function deleteDataScopePolicy(id: string) {
  return http.delete<void>(`/data-scope-policies/${id}`);
}

export function deletePolicy(id: string) {
  return deleteDataScopePolicy(id);
}

/**
 * 获取组织列表
 */
export function getOrganizationLists(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return http.get<{
    items?: OrganizationList[];
    page?: number;
    pageSize?: number;
    total?: number;
    totalPages?: number;
  } | OrganizationList[]>('/organization-lists', { params });
}

/**
 * 创建组织列表
 */
export function createOrganizationList(params: { name: string; organizationIds: string[] }) {
  return http.post<OrganizationList>('/organization-lists', params);
}

/**
 * 更新组织列表
 */
export function updateOrganizationList(id: string, params: { name?: string; organizationIds?: string[] }) {
  return http.put<OrganizationList>(`/organization-lists/${id}`, params);
}

/**
 * 删除组织列表
 */
export function deleteOrganizationList(id: string) {
  return http.delete<void>(`/organization-lists/${id}`);
}

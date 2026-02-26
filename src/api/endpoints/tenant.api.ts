import type { ApiResponse, PaginatedResponse } from '../types';
import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';

/**
 * 租户实体 Schema
 */
export const TenantSchema = BaseEntitySchema.extend({
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  ownerId: z.string().optional(),
  status: z.string().optional(),
});
export type Tenant = z.infer<typeof TenantSchema>;

/**
 * 当前用户租户信息 Schema
 */
export const MyTenantSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  role: z.string().optional(),
  status: z.string().optional(),
  isDefault: z.boolean().optional(),
});
export type MyTenant = z.infer<typeof MyTenantSchema>;

/**
 * 租户列表查询参数 Schema
 */
export const TenantListParamsSchema = PaginationParamsSchema.extend({
  query: z.string().optional(),
  status: z.string().optional(),
  includeDeleted: z.boolean().optional(),
});
export type TenantListParams = z.infer<typeof TenantListParamsSchema>;

/**
 * 租户用户列表查询参数 Schema
 */
export const TenantUserListParamsSchema = PaginationParamsSchema.extend({});
export type TenantUserListParams = z.infer<typeof TenantUserListParamsSchema>;

/**
 * 创建租户参数 Schema
 */
export const CreateTenantParamsSchema = z.object({
  name: z.string().min(1, '租户名称不能为空'),
  code: z.string().min(1, '租户编码不能为空'),
  description: z.string().optional(),
  status: z.string().optional(),
});
export type CreateTenantParams = z.infer<typeof CreateTenantParamsSchema>;

/**
 * 更新租户参数 Schema
 */
export const UpdateTenantParamsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
});
export type UpdateTenantParams = z.infer<typeof UpdateTenantParamsSchema>;

/**
 * 租户成员 Schema
 */
export const TenantUserSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  username: z.string().optional(),
  nickname: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  status: z.string().optional(),
  isDefault: z.boolean().optional(),
  tenantId: z.string().optional(),
});
export type TenantUser = z.infer<typeof TenantUserSchema>;

/**
 * 添加租户成员参数 Schema
 */
export const AddTenantUserParamsSchema = z.object({
  userId: z.string().min(1, '用户ID不能为空'),
});
export type AddTenantUserParams = z.infer<typeof AddTenantUserParamsSchema>;

export interface MyDomainListResponse {
  domains?: unknown[];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as Record<string, unknown>;
}

function pickString(source: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function pickBoolean(source: Record<string, unknown> | undefined, keys: string[]): boolean | undefined {
  if (!source) {
    return undefined;
  }

  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'boolean') {
      return value;
    }
  }

  return undefined;
}

function preferString(existingValue: string | undefined, nextValue: string | undefined, fallback?: string): string | undefined {
  if (!nextValue) {
    return existingValue;
  }
  if (!existingValue) {
    return nextValue;
  }
  if (fallback && existingValue !== fallback && nextValue === fallback) {
    return existingValue;
  }
  return nextValue;
}

export function mapMyDomainsToTenants(domains?: unknown[]): MyTenant[] {
  if (!domains || domains.length === 0) {
    return [];
  }

  const tenants = new Map<string, MyTenant>();

  for (const item of domains) {
    const current = asRecord(item);
    if (!current) {
      continue;
    }

    const domain = asRecord(current.domain);
    const membership = asRecord(current.membership);
    const tenant = asRecord(current.tenant);

    const domainType = pickString(current, ['type', 'domainType', 'typeCode'])
      ?? pickString(domain, ['type', 'domainType', 'typeCode', 'code']);
    if (domainType !== 'tenant') {
      continue;
    }

    const tenantId = pickString(current, ['key', 'domainKey'])
      ?? pickString(domain, ['key', 'domainKey'])
      ?? pickString(tenant, ['id']);
    if (!tenantId) {
      continue;
    }

    const nextTenant: MyTenant = {
      id: tenantId,
      code: pickString(current, ['code']) ?? pickString(tenant, ['code']) ?? tenantId,
      name: pickString(current, ['displayName', 'name'])
        ?? pickString(domain, ['displayName', 'name'])
        ?? pickString(tenant, ['displayName', 'name'])
        ?? tenantId,
      role: pickString(current, ['role', 'memberRole'])
        ?? pickString(membership, ['role', 'memberRole']),
      status: pickString(current, ['status'])
        ?? pickString(domain, ['status'])
        ?? pickString(tenant, ['status']),
      isDefault: pickBoolean(current, ['isDefault'])
        ?? pickBoolean(membership, ['isDefault']),
    };

    const existing = tenants.get(tenantId);
    if (!existing) {
      tenants.set(tenantId, nextTenant);
      continue;
    }

    tenants.set(tenantId, {
      id: tenantId,
      code: preferString(existing.code, nextTenant.code, tenantId) ?? tenantId,
      name: preferString(existing.name, nextTenant.name, tenantId) ?? tenantId,
      role: nextTenant.role || existing.role,
      status: nextTenant.status || existing.status,
      isDefault: existing.isDefault || nextTenant.isDefault,
    });
  }

  return Array.from(tenants.values());
}

/**
 * 获取租户列表（分页）
 */
export function getTenantList(params?: TenantListParams) {
  return http.get<PaginatedResponse<Tenant>>('/tenants', { params });
}

/**
 * 获取当前用户可访问的域
 */
export function getMyDomains() {
  return http.get<MyDomainListResponse>('/domains/me');
}

/**
 * 获取当前用户可访问的租户（由 /domains/me 映射）
 */
export function getMyTenants() {
  return getMyDomains().then((response): ApiResponse<{ tenants: MyTenant[] }> => ({
    ...response,
    data: {
      tenants: mapMyDomainsToTenants(response.data?.domains),
    },
  }));
}

/**
 * 获取租户详情
 */
export function getTenantById(id: string) {
  return http.get<Tenant>(`/tenants/${id}`);
}

/**
 * 创建租户
 */
export function createTenant(params: CreateTenantParams) {
  return http.post<Tenant>('/tenants', params);
}

/**
 * 更新租户
 */
export function updateTenant(id: string, params: UpdateTenantParams) {
  return http.put<Tenant>(`/tenants/${id}`, params);
}

/**
 * 删除租户
 */
export function deleteTenant(id: string) {
  return http.delete<void>(`/tenants/${id}`);
}

/**
 * 获取租户成员列表（分页）
 */
export function getTenantUsers(id: string, params?: TenantUserListParams) {
  return http.get<PaginatedResponse<TenantUser>>(`/tenants/${id}/members`, { params });
}

/**
 * 添加租户成员
 */
export function addTenantUser(id: string, params: AddTenantUserParams) {
  return http.post<void>(`/tenants/${id}/members`, params);
}

/**
 * 移除租户成员
 */
export function removeTenantUser(id: string, userId: string) {
  return http.delete<void>(`/tenants/${id}/members/${userId}`);
}

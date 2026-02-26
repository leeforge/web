import type { PaginatedResponse } from '../types';
import { z } from 'zod';
import { http } from '../client';
import { PaginationParamsSchema } from '../types';

/**
 * API Key DTO Schema
 */
export const APIKeySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  key: z.string(), // Only the prefix, e.g., "pk_live_****"
  isActive: z.boolean(),
  expiresAt: z.string().optional().nullable(),
  lastUsedAt: z.string().optional().nullable(),
  lastUsedIp: z.string().optional().nullable(),
  usageCount: z.number().optional(),
  rateLimit: z.number().optional(),
  dailyLimit: z.number().optional(),
  permissions: z.array(z.string()).optional(),
  dataFilters: z.record(z.string(), z.any()).optional(),
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  projectId: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type APIKey = z.infer<typeof APIKeySchema>;

/**
 * API Key 统计 Schema
 */
export const APIKeyStatsSchema = z.object({
  usageCount: z.number(),
  lastUsedAt: z.string().optional().nullable(),
  lastUsedIp: z.string().optional().nullable(),
  isActive: z.boolean(),
  expiresAt: z.string().optional().nullable(),
});
export type APIKeyStats = z.infer<typeof APIKeyStatsSchema>;

/**
 * API Key 列表查询参数 Schema
 */
export const APIKeyListParamsSchema = PaginationParamsSchema.extend({
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  projectId: z.string().optional(),
});
export type APIKeyListParams = z.infer<typeof APIKeyListParamsSchema>;

/**
 * 创建 API Key 请求 Schema
 */
export const CreateAPIKeyParamsSchema = z.object({
  name: z.string().min(1, 'API Key 名称不能为空'),
  description: z.string().optional(),
  environment: z.enum(['live', 'test']).optional(),
  expiresAt: z.string().optional(),
  rateLimit: z.number().int().min(0).optional(),
  dailyLimit: z.number().int().min(0).optional(),
  roleId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  projectId: z.string().optional(),
  dataFilters: z.record(z.string(), z.any()).optional(),
});
export type CreateAPIKeyParams = z.infer<typeof CreateAPIKeyParamsSchema>;

/**
 * 创建 API Key 响应 Schema
 */
export const CreateAPIKeyResponseSchema = z.object({
  apiKey: APIKeySchema,
  secretKey: z.string(), // Raw key, shown only once
});
export type CreateAPIKeyResponse = z.infer<typeof CreateAPIKeyResponseSchema>;

/**
 * 更新 API Key 请求 Schema
 */
export const UpdateAPIKeyParamsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  rateLimit: z.number().int().min(0).optional(),
  dailyLimit: z.number().int().min(0).optional(),
  roleId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  domainType: z.string().optional(),
  domainKey: z.string().optional(),
  projectId: z.string().optional(),
  dataFilters: z.record(z.string(), z.any()).optional(),
});
export type UpdateAPIKeyParams = z.infer<typeof UpdateAPIKeyParamsSchema>;

/**
 * 验证 API Key 请求 Schema
 */
export const ValidateAPIKeyParamsSchema = z.object({
  key: z.string().min(1, 'API Key 不能为空'),
});
export type ValidateAPIKeyParams = z.infer<typeof ValidateAPIKeyParamsSchema>;

/**
 * 验证 API Key 响应 Schema
 */
export const ValidateAPIKeyResponseSchema = z.object({
  valid: z.boolean(),
  keyId: z.string().optional(),
  name: z.string().optional(),
  ownerId: z.string().optional(),
  roleId: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  dataFilters: z.record(z.string(), z.any()).optional(),
  rateLimit: z.number().optional(),
  dailyLimit: z.number().optional(),
});
export type ValidateAPIKeyResponse = z.infer<typeof ValidateAPIKeyResponseSchema>;

/**
 * 获取 API Key 列表（分页）
 */
export function getAPIKeyList(params?: APIKeyListParams) {
  return http.get<PaginatedResponse<APIKey>>('/api-keys', { params });
}

/**
 * 获取 API Key 详情
 */
export function getAPIKeyById(id: string) {
  return http.get<APIKey>(`/api-keys/${id}`);
}

/**
 * 创建 API Key
 */
export function createAPIKey(params: CreateAPIKeyParams) {
  return http.post<CreateAPIKeyResponse>('/api-keys', params);
}

/**
 * 更新 API Key
 */
export function updateAPIKey(id: string, params: UpdateAPIKeyParams) {
  return http.put<APIKey>(`/api-keys/${id}`, params);
}

/**
 * 禁用 API Key（软删除，设置 isActive = false）
 */
export function disableAPIKey(id: string) {
  return http.post<{ message: string }>(`/api-keys/${id}/revoke`);
}

/**
 * 删除 API Key（永久删除）
 */
export function deleteAPIKey(id: string) {
  return http.delete<{ message: string }>(`/api-keys/${id}`);
}

/**
 * 轮换 API Key（生成新密钥）
 */
export function rotateAPIKey(id: string) {
  return http.post<CreateAPIKeyResponse>(`/api-keys/${id}/rotate`);
}

/**
 * 获取 API Key 使用统计
 */
export function getAPIKeyStats(id: string) {
  return http.get<APIKeyStats>(`/api-keys/${id}/stats`);
}

/**
 * 验证 API Key
 */
export function validateAPIKey(params: ValidateAPIKeyParams) {
  return http.post<ValidateAPIKeyResponse>('/api-keys/validate', params);
}

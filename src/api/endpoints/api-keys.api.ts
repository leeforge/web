import type { PaginationParamsSchema } from '../types';
import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema } from '../types';

/**
 * API Key Types
 */

export const APIKeySchema = BaseEntitySchema.extend({
  name: z.string(),
  prefix: z.string(),
  key: z.string().optional(), // Only returned on creation/rotation
  scopes: z.array(z.string()),
  lastUsedAt: z.string().optional(),
  expiresAt: z.string().optional(),
  status: z.enum(['active', 'inactive', 'revoked']),
  description: z.string().optional(),
});
export type APIKey = z.infer<typeof APIKeySchema>;

export const APIKeyStatsDTOSchema = z.object({
  totalRequests: z.number(),
  lastUsedAt: z.string().optional(),
  requestsByDay: z.record(z.number(), z.number()),
});
export type APIKeyStatsDTO = z.infer<typeof APIKeyStatsDTOSchema>;

export const CreateAPIKeyRequestSchema = z.object({
  name: z.string().min(1, '名称不能为空'),
  scopes: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
  description: z.string().optional(),
});
export type CreateAPIKeyRequest = z.infer<typeof CreateAPIKeyRequestSchema>;

export const UpdateAPIKeyRequestSchema = z.object({
  name: z.string().min(1).optional(),
  scopes: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive']).optional(),
  description: z.string().optional(),
});
export type UpdateAPIKeyRequest = z.infer<typeof UpdateAPIKeyRequestSchema>;

export const ValidateAPIKeyRequestSchema = z.object({
  key: z.string(),
});
export type ValidateAPIKeyRequest = z.infer<typeof ValidateAPIKeyRequestSchema>;

export const ValidateAPIKeyResponseSchema = z.object({
  valid: z.boolean(),
  apiKey: APIKeySchema.optional(),
  scopes: z.array(z.string()).optional(),
});
export type ValidateAPIKeyResponse = z.infer<typeof ValidateAPIKeyResponseSchema>;

export const CreateAPIKeyResponseSchema = APIKeySchema.extend({
  key: z.string(), // The full key, only shown once
});
export type CreateAPIKeyResponse = z.infer<typeof CreateAPIKeyResponseSchema>;

/**
 * API Key Endpoints
 */

/**
 * List all API keys
 */
export function getApiKeys(params?: z.infer<typeof PaginationParamsSchema>) {
  return http.get<APIKey[]>('/api-keys', { params });
}

/**
 * Create a new API key
 */
export function createApiKey(data: CreateAPIKeyRequest) {
  return http.post<CreateAPIKeyResponse>('/api-keys', data);
}

/**
 * Validate an API key
 */
export function validateApiKey(data: ValidateAPIKeyRequest) {
  return http.post<ValidateAPIKeyResponse>('/api-keys/validate', data);
}

/**
 * Get a specific API key
 */
export function getApiKey(id: string) {
  return http.get<APIKey>(`/api-keys/${id}`);
}

/**
 * Update an API key
 */
export function updateApiKey(id: string, data: UpdateAPIKeyRequest) {
  return http.put<APIKey>(`/api-keys/${id}`, data);
}

/**
 * Revoke (delete/deactivate) an API key
 */
export function deleteApiKey(id: string) {
  return http.delete<void>(`/api-keys/${id}`);
}

/**
 * Rotate (regenerate) an API key
 */
export function rotateApiKey(id: string) {
  return http.post<CreateAPIKeyResponse>(`/api-keys/${id}/rotate`);
}

/**
 * Get usage statistics for an API key
 */
export function getApiKeyStats(id: string) {
  return http.get<APIKeyStatsDTO>(`/api-keys/${id}/stats`);
}

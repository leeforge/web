import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema } from '../types';

/**
 * Dictionary Schemas
 */

export const DictionaryDetailSchema = BaseEntitySchema.extend({
  dictionaryId: z.string(),
  label: z.string(),
  value: z.string(),
  sort: z.number(),
  status: z.enum(['active', 'inactive']),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
  remark: z.string().optional(),
});
export type DictionaryDetail = z.infer<typeof DictionaryDetailSchema>;

// Need to use z.lazy for recursive type if Dictionary refers to itself
export const DictionarySchema: z.ZodType<any> = BaseEntitySchema.extend({
  code: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  isTree: z.boolean().optional(),
  details: z.array(DictionaryDetailSchema).optional(),
  children: z.lazy(() => z.array(DictionarySchema)).optional(),
});
export type Dictionary = z.infer<typeof DictionarySchema>;

export const CreateDictionaryRequestSchema = z.object({
  code: z.string().min(1, '编码不能为空'),
  name: z.string().min(1, '名称不能为空'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  isTree: z.boolean().optional(),
});
export type CreateDictionaryRequest = z.infer<typeof CreateDictionaryRequestSchema>;

export const UpdateDictionaryRequestSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
});
export type UpdateDictionaryRequest = z.infer<typeof UpdateDictionaryRequestSchema>;

export const CreateDictionaryDetailRequestSchema = z.object({
  dictionaryId: z.string().optional(), // Optional if passed via path or context
  label: z.string().min(1, '标签不能为空'),
  value: z.string().min(1, '值不能为空'),
  sort: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
  remark: z.string().optional(),
});
export type CreateDictionaryDetailRequest = z.infer<typeof CreateDictionaryDetailRequestSchema>;

export const UpdateDictionaryDetailRequestSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  sort: z.number().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  color: z.string().optional(),
  isDefault: z.boolean().optional(),
  remark: z.string().optional(),
});
export type UpdateDictionaryDetailRequest = z.infer<typeof UpdateDictionaryDetailRequestSchema>;

/**
 * Dictionary Endpoints
 */

/**
 * Create a new dictionary
 */
export function createDictionary(data: CreateDictionaryRequest) {
  return http.post<Dictionary>('/dictionaries', data);
}

/**
 * Get dictionary tree
 */
export function getDictionaryTree() {
  return http.get<Dictionary[]>('/dictionaries/tree');
}

/**
 * Update a dictionary
 */
export function updateDictionary(id: string, data: UpdateDictionaryRequest) {
  return http.put<Dictionary>(`/dictionaries/${id}`, data);
}

/**
 * Delete a dictionary
 */
export function deleteDictionary(id: string) {
  return http.delete<void>(`/dictionaries/${id}`);
}

/**
 * Create a dictionary detail item
 */
export function createDictionaryDetail(dictionaryId: string, data: CreateDictionaryDetailRequest) {
  // The swagger shows /dictionaries/{id}/details for creation
  return http.post<DictionaryDetail>(`/dictionaries/${dictionaryId}/details`, data);
}

/**
 * Update a dictionary detail item
 */
export function updateDictionaryDetail(id: string, data: UpdateDictionaryDetailRequest) {
  return http.put<DictionaryDetail>(`/dictionary-details/${id}`, data);
}

/**
 * Delete a dictionary detail item
 */
export function deleteDictionaryDetail(id: string) {
  return http.delete<void>(`/dictionary-details/${id}`);
}

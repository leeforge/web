import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema } from '../types';

/**
 * 字典详情项 Schema
 */
export const DictionaryDetailSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  extend: z.string().optional(),
  sort: z.number().int().optional(),
  status: z.boolean().optional(),
  dictionaryId: z.string().optional(),
  archivedAt: z.string().optional(),
  createdAt: z.string().optional(),
  createdById: z.string().optional(),
  updatedAt: z.string().optional(),
  updatedById: z.string().optional(),
  deletedAt: z.string().optional(),
  deletedById: z.string().optional(),
  publishedAt: z.string().optional(),
});
export type DictionaryDetail = z.infer<typeof DictionaryDetailSchema>;

/**
 * 字典实体 Schema
 */
export const DictionarySchema = BaseEntitySchema.extend({
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  status: z.boolean().optional(),
  publishedAt: z.string().optional(),
  archivedAt: z.string().optional(),
  createdById: z.string().optional(),
  updatedById: z.string().optional(),
  deletedAt: z.string().optional(),
  deletedById: z.string().optional(),
  items: z.array(DictionaryDetailSchema).optional(),
});
export type Dictionary = z.infer<typeof DictionarySchema>;

/**
 * 创建字典参数 Schema
 */
export const CreateDictionaryParamsSchema = z.object({
  name: z.string().min(1, '字典名称不能为空'),
  code: z.string().min(1, '字典编码不能为空'),
  description: z.string().optional(),
  status: z.boolean().optional(),
});
export type CreateDictionaryParams = z.infer<typeof CreateDictionaryParamsSchema>;

/**
 * 更新字典参数 Schema
 */
export const UpdateDictionaryParamsSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.boolean().optional(),
});
export type UpdateDictionaryParams = z.infer<typeof UpdateDictionaryParamsSchema>;

/**
 * 创建字典详情参数 Schema
 */
export const CreateDictionaryDetailParamsSchema = z.object({
  label: z.string().min(1, '展示名不能为空'),
  value: z.string().min(1, '字典值不能为空'),
  extend: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  status: z.boolean().optional(),
});
export type CreateDictionaryDetailParams = z.infer<typeof CreateDictionaryDetailParamsSchema>;

/**
 * 更新字典详情参数 Schema
 */
export const UpdateDictionaryDetailParamsSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  extend: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  status: z.boolean().optional(),
});
export type UpdateDictionaryDetailParams = z.infer<typeof UpdateDictionaryDetailParamsSchema>;

/**
 * 获取字典列表（扁平化）
 */
export function getDictionaryList() {
  return http.get<Dictionary[]>('/dictionaries');
}

// 兼容旧调用：树接口已废弃但仍可能存在
export const getDictionaryTree = getDictionaryList;

/**
 * 获取字典详情
 */
export function getDictionaryById(id: string) {
  return http.get<Dictionary>(`/dictionaries/${id}`);
}

/**
 * 根据编码获取字典数据（公开接口）
 * 返回字典项列表
 */
export function getDictionaryByCode(code: string) {
  return http.get<DictionaryDetail[]>(`/dictionaries/${code}/details`);
}

/**
 * 创建字典
 */
export function createDictionary(params: CreateDictionaryParams) {
  return http.post<Dictionary>('/dictionaries', params);
}

/**
 * 更新字典
 */
export function updateDictionary(id: string, params: UpdateDictionaryParams) {
  return http.put<Dictionary>(`/dictionaries/${id}`, params);
}

/**
 * 删除字典
 */
export function deleteDictionary(id: string) {
  return http.delete<Record<string, string> | void>(`/dictionaries/${id}`);
}

/**
 * 获取字典详情列表
 */
export function getDictionaryDetails(id: string) {
  return http.get<DictionaryDetail[]>(`/dictionaries/${id}/details`);
}

/**
 * 创建字典详情项
 */
export function createDictionaryDetail(dictionaryId: string, params: CreateDictionaryDetailParams) {
  return http.post<DictionaryDetail>(`/dictionaries/${dictionaryId}/details`, params);
}

/**
 * 更新字典详情项
 */
export function updateDictionaryDetail(id: string, params: UpdateDictionaryDetailParams) {
  return http.put<DictionaryDetail>(`/dictionary-details/${id}`, params);
}

/**
 * 删除字典详情项
 */
export function deleteDictionaryDetail(id: string) {
  return http.delete<Record<string, string> | void>(`/dictionary-details/${id}`);
}

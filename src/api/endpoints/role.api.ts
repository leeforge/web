import type { PaginatedResponse } from '../types';
import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';

const RoleMenuRefSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  path: z.string().optional(),
});

export const DefaultDataScopeSchema = z.enum(['ALL', 'SELF', 'OU_SELF', 'OU_SUBTREE']);
export type DefaultDataScope = z.infer<typeof DefaultDataScopeSchema>;

/**
 * 角色实体 Schema
 */
export const RoleSchema = BaseEntitySchema.extend({
  name: z.string(),
  code: z.string(),
  defaultDataScope: DefaultDataScopeSchema.optional(),
  description: z.string().optional(),
  sort: z.number().optional(),
  isSystem: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
  menuIds: z.array(z.string()).optional(),
  edges: z.object({
    menus: z.array(RoleMenuRefSchema).optional(),
  }).optional(),
});
export type Role = z.infer<typeof RoleSchema>;

/**
 * 角色列表查询参数 Schema
 */
export const RoleListParamsSchema = PaginationParamsSchema.extend({
  q: z.string().optional(),
});
export type RoleListParams = z.infer<typeof RoleListParamsSchema>;

/**
 * 创建角色参数 Schema
 */
export const CreateRoleParamsSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  code: z.string().min(1, '角色编码不能为空'),
  defaultDataScope: DefaultDataScopeSchema.optional(),
  description: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  permissions: z.array(z.string()).optional(),
});
export type CreateRoleParams = z.infer<typeof CreateRoleParamsSchema>;

/**
 * 更新角色参数 Schema
 */
export const UpdateRoleParamsSchema = z.object({
  name: z.string().min(1).optional(),
  defaultDataScope: DefaultDataScopeSchema.optional(),
  description: z.string().optional(),
  sort: z.number().int().min(0).optional(),
  permissions: z.array(z.string()).optional(),
});
export type UpdateRoleParams = z.infer<typeof UpdateRoleParamsSchema>;

/**
 * 复制角色参数 Schema
 */
export const CopyRoleParamsSchema = z.object({
  name: z.string().min(1, '角色名称不能为空'),
  code: z.string().min(1, '角色编码不能为空'),
});
export type CopyRoleParams = z.infer<typeof CopyRoleParamsSchema>;

/**
 * 设置角色 API 权限参数 Schema
 */
export const SetRoleAPIsParamsSchema = z.object({
  permissionCodes: z.array(z.string()),
});
export type SetRoleAPIsParams = z.infer<typeof SetRoleAPIsParamsSchema>;

/**
 * 设置角色菜单权限参数 Schema
 */
export const SetRoleMenusParamsSchema = z.object({
  menuIds: z.array(z.string()),
});
export type SetRoleMenusParams = z.infer<typeof SetRoleMenusParamsSchema>;

/**
 * 获取角色列表（分页）
 */
export function getRoleList(params?: RoleListParams) {
  return http.get<PaginatedResponse<Role>>('/roles', { params });
}

/**
 * 获取角色详情
 */
export function getRoleById(id: string) {
  return http.get<Role>(`/roles/${id}`);
}

/**
 * 创建角色
 */
export function createRole(params: CreateRoleParams) {
  return http.post<Role>('/roles', params);
}

/**
 * 更新角色
 */
export function updateRole(id: string, params: UpdateRoleParams) {
  return http.put<Role>(`/roles/${id}`, params);
}

/**
 * 删除角色
 */
export function deleteRole(id: string) {
  return http.delete<void>(`/roles/${id}`);
}

/**
 * 复制角色
 */
export function copyRole(id: string, params: CopyRoleParams) {
  return http.post<Role>(`/roles/${id}/copy`, params);
}

/**
 * 设置角色 API 权限
 */
export function setRoleAPIs(id: string, params: SetRoleAPIsParams) {
  return http.post<Role>(`/roles/${id}/permissions`, params);
}

/**
 * 设置角色菜单权限
 */
export function setRoleMenus(id: string, params: SetRoleMenusParams) {
  return http.post<Role>(`/roles/${id}/menus`, params);
}

/**
 * 获取角色下的用户列表
 */
export function getRoleUsers(id: string) {
  return http.get<PaginatedResponse<{ id: string; username: string; nickname?: string }>>(`/roles/${id}/users`);
}

import type { PaginationParams } from '../types';
import { http } from '../client';

export type PermissionItem = string | number | boolean | Record<string, unknown>;

export type PermissionListResponse
  = | PermissionItem[]
    | { permissions?: PermissionItem[]; items?: PermissionItem[]; list?: PermissionItem[] }
    | { data?: PermissionItem[] };

export interface PermissionSyncResponse {
  message?: string;
  created?: number;
  updated?: number;
  deleted?: number;
  total?: number;
}

export interface PermissionListParams extends PaginationParams {
  scope?: 'api' | 'ui' | 'data';
  status?: 'active' | 'deprecated';
  q?: string;
}

/**
 * 获取权限列表
 * 默认返回权限字符串数组
 */
export function getPermissionList(params?: PermissionListParams) {
  return http.get<PermissionListResponse>('/permissions', { params });
}

/**
 * 同步权限
 */
export function syncPermissions() {
  return http.post<PermissionSyncResponse>('/permissions/sync');
}

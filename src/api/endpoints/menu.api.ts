import type { PaginatedResponse } from '../types';
import { z } from 'zod';
import { http } from '../client';
import { BaseEntitySchema, PaginationParamsSchema } from '../types';

/**
 * 菜单按钮 Schema
 */
export const MenuButtonSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  description: z.string().optional(),
  createdAt: z.string().optional(),
});
export type MenuButton = z.infer<typeof MenuButtonSchema>;

/**
 * 菜单实体 Schema
 */
export const MenuSchema = BaseEntitySchema.extend({
  name: z.string(),
  path: z.string(),
  icon: z.string().optional(),
  component: z.string().optional(),
  redirect: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sort: z.number().optional(),
  hidden: z.boolean().optional(),
  affix: z.boolean().optional(),
  meta: z.record(z.string(), z.any()).optional(),
  params: z.array(z.string()).optional(),
  children: z.array(z.lazy(() => MenuSchema)).optional(),
  buttons: z.array(MenuButtonSchema).optional(),
});
export type Menu = z.infer<typeof MenuSchema>;

/**
 * 菜单树节点 Schema（用于树形展示）
 */
export const MenuTreeNodeSchema: z.ZodType<Menu> = MenuSchema;
export type MenuTreeNode = Menu;

/**
 * 菜单列表查询参数 Schema
 */
export const MenuListParamsSchema = PaginationParamsSchema.extend({
  q: z.string().optional(),
});
export type MenuListParams = z.infer<typeof MenuListParamsSchema>;

/**
 * 创建菜单参数 Schema
 */
export const CreateMenuParamsSchema = z.object({
  name: z.string().min(1, '菜单名称不能为空'),
  path: z.string().min(1, '菜单路径不能为空'),
  icon: z.string().optional(),
  component: z.string().optional(),
  redirect: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sort: z.number().int().min(0).optional(),
  hidden: z.boolean().optional(),
  affix: z.boolean().optional(),
  meta: z.record(z.string(), z.any()).optional(),
  params: z.array(z.string()).optional(),
});
export type CreateMenuParams = z.infer<typeof CreateMenuParamsSchema>;

/**
 * 更新菜单参数 Schema
 */
export const UpdateMenuParamsSchema = z.object({
  name: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  icon: z.string().optional(),
  component: z.string().optional(),
  redirect: z.string().optional(),
  parentId: z.string().optional().nullable(),
  sort: z.number().int().min(0).optional(),
  hidden: z.boolean().optional(),
  affix: z.boolean().optional(),
  meta: z.record(z.string(), z.any()).optional(),
  params: z.array(z.string()).optional(),
});
export type UpdateMenuParams = z.infer<typeof UpdateMenuParamsSchema>;

/**
 * 添加菜单按钮参数 Schema
 */
export const AddMenuButtonParamsSchema = z.object({
  name: z.string().min(1, '按钮名称不能为空'),
  code: z.string().min(1, '按钮编码不能为空'),
  description: z.string().optional(),
});
export type AddMenuButtonParams = z.infer<typeof AddMenuButtonParamsSchema>;

/**
 * 获取菜单列表（分页）
 */
export function getMenuList(params?: MenuListParams) {
  return http.get<PaginatedResponse<Menu>>('/menus', { params });
}

/**
 * 获取菜单树
 */
export function getMenuTree() {
  return http.get<{ data: Menu[] }>('/menus/tree');
}

/**
 * 获取当前用户可访问的菜单
 */
export function getAccessibleMenus() {
  return http.get<{ data: Menu[] }>('/menus/accessible');
}

/**
 * 获取菜单详情
 */
export function getMenuById(id: string) {
  return http.get<Menu>(`/menus/${id}`);
}

/**
 * 创建菜单
 */
export function createMenu(params: CreateMenuParams) {
  return http.post<Menu>('/menus', params);
}

/**
 * 更新菜单
 */
export function updateMenu(id: string, params: UpdateMenuParams) {
  return http.put<Menu>(`/menus/${id}`, params);
}

/**
 * 删除菜单
 */
export function deleteMenu(id: string) {
  return http.delete<void>(`/menus/${id}`);
}

/**
 * 获取菜单按钮列表
 */
export function getMenuButtons(id: string) {
  return http.get<{ data: MenuButton[] }>(`/menus/${id}/buttons`);
}

/**
 * 添加菜单按钮
 */
export function addMenuButton(id: string, params: AddMenuButtonParams) {
  return http.post<MenuButton>(`/menus/${id}/buttons`, params);
}

/**
 * 同步菜单
 */
export function syncMenus() {
  return http.post<void>('/menus/sync');
}

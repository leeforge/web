import type { ApiError, Menu } from '@/api';
import { Result } from 'rusty-result-kit';
import { createStore } from 'zustand';
import { getAccessibleMenus, getMenuTree } from '@/api';

/**
 * 菜单状态管理 Store
 * 管理用户可访问的菜单和完整菜单树
 */

export interface MenuState {
  /** 用户可访问的菜单树 */
  accessibleMenus: Menu[];
  /** 完整菜单树（管理用） */
  menuTree: Menu[];
  /** 扁平化的菜单列表（方便查找） */
  flatMenus: Menu[];
  /** 加载状态 */
  loading: boolean;
  /** 错误信息 */
  error: ApiError | null;
}

export interface MenuActions {
  /** 加载用户可访问的菜单 */
  loadAccessibleMenus: (force?: boolean) => Promise<Menu[]>;
  /** 加载完整菜单树 */
  loadMenuTree: (force?: boolean) => Promise<Menu[]>;
  /** 根据 path 查找菜单 */
  findByPath: (path: string) => Menu | undefined;
  /** 根据 id 查找菜单 */
  findById: (id: string) => Menu | undefined;
  /** 清除缓存 */
  clear: () => void;
  /** 检查是否有权限访问某个路径 */
  hasAccess: (path: string) => boolean;
  /** 获取面包屑路径 */
  getBreadcrumbs: (path: string) => Menu[];
}

/**
 * 将菜单树扁平化
 */
function flattenMenus(menus: Menu[]): Menu[] {
  const result: Menu[] = [];
  const traverse = (items: Menu[]) => {
    for (const item of items) {
      result.push(item);
      if (item.children?.length) {
        traverse(item.children);
      }
    }
  };
  traverse(menus);
  return result;
}

/**
 * 在菜单树中查找路径对应的面包屑
 */
function findBreadcrumbs(menus: Menu[], targetPath: string): Menu[] {
  const result: Menu[] = [];

  const traverse = (items: Menu[], path: Menu[]): boolean => {
    for (const item of items) {
      const currentPath = [...path, item];
      if (item.path === targetPath) {
        result.push(...currentPath);
        return true;
      }
      if (item.children?.length && traverse(item.children, currentPath)) {
        return true;
      }
    }
    return false;
  };

  traverse(menus, []);
  return result;
}

export const MenuStore = createStore<MenuState & MenuActions>()((set, get) => ({
  accessibleMenus: [],
  menuTree: [],
  flatMenus: [],
  loading: false,
  error: null,

  loadAccessibleMenus: async (force = false) => {
    const state = get();

    // 如果已有缓存且不强制刷新
    if (!force && state.accessibleMenus.length > 0) {
      return state.accessibleMenus;
    }

    set({ loading: true, error: null });

    const { ok, value, error } = await Result.fromPromise(getAccessibleMenus());

    if (ok && value?.data) {
      const menus = value.data;
      const flatMenus = flattenMenus(menus);
      set({
        accessibleMenus: menus,
        flatMenus,
        loading: false,
      });
      return menus;
    }

    set({
      loading: false,
      error: error as ApiError,
    });
    return [];
  },

  loadMenuTree: async (force = false) => {
    const state = get();

    // 如果已有缓存且不强制刷新
    if (!force && state.menuTree.length > 0) {
      return state.menuTree;
    }

    set({ loading: true, error: null });

    const { ok, value, error } = await Result.fromPromise(getMenuTree());

    if (ok && value?.data) {
      const menus = value.data;
      set({
        menuTree: menus,
        loading: false,
      });
      return menus;
    }

    set({
      loading: false,
      error: error as ApiError,
    });
    return [];
  },

  findByPath: (path) => {
    const { flatMenus } = get();
    return flatMenus.find(menu => menu.path === path);
  },

  findById: (id) => {
    const { flatMenus } = get();
    return flatMenus.find(menu => menu.id === id);
  },

  clear: () => {
    set({
      accessibleMenus: [],
      menuTree: [],
      flatMenus: [],
      error: null,
    });
  },

  hasAccess: (path) => {
    const { flatMenus } = get();
    return flatMenus.some(menu => menu.path === path);
  },

  getBreadcrumbs: (path) => {
    const { accessibleMenus } = get();
    return findBreadcrumbs(accessibleMenus, path);
  },
}));

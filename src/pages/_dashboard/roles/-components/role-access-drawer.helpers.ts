import type { Role } from '@/api/endpoints/role.api';

export type RoleAccessTabKey = 'menu' | 'permission' | 'data-scope';

export interface RoleAccessDrawerRole {
  id: Role['id'];
  code: Role['code'];
  name: Role['name'];
}

export interface RoleAccessDrawerState {
  open: boolean;
  role: RoleAccessDrawerRole | null;
  activeTab: RoleAccessTabKey;
}

const DEFAULT_TAB: RoleAccessTabKey = 'menu';

export function createClosedRoleAccessDrawerState(): RoleAccessDrawerState {
  return {
    open: false,
    role: null,
    activeTab: DEFAULT_TAB,
  };
}

export function openRoleAccessDrawer(
  role: RoleAccessDrawerRole,
  tab: RoleAccessTabKey = DEFAULT_TAB,
): RoleAccessDrawerState {
  return {
    open: true,
    role,
    activeTab: tab,
  };
}

export function closeRoleAccessDrawer(
  state: RoleAccessDrawerState,
): RoleAccessDrawerState {
  return {
    ...state,
    open: false,
    role: null,
  };
}

export function getRoleAccessDrawerTitle(roleName: string): string {
  return `角色权限配置 - ${roleName}`;
}

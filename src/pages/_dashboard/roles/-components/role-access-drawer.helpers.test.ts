import { describe, expect, it } from 'bun:test';
import {
  closeRoleAccessDrawer,
  createClosedRoleAccessDrawerState,
  getRoleAccessDrawerTitle,
  openRoleAccessDrawer,
} from './role-access-drawer.helpers';

describe('role access drawer helpers', () => {
  it('opens drawer with role context and default tab', () => {
    const state = openRoleAccessDrawer({
      id: 'role-1',
      code: 'editor',
      name: '编辑',
    });

    expect(state).toEqual({
      open: true,
      role: { id: 'role-1', code: 'editor', name: '编辑' },
      activeTab: 'menu',
    });
  });

  it('supports permission tab when opening drawer explicitly', () => {
    const state = openRoleAccessDrawer(
      { id: 'role-1', code: 'editor', name: '编辑' },
      'permission',
    );

    expect(state.activeTab).toBe('permission');
  });

  it('closes drawer but keeps last selected tab', () => {
    const state = closeRoleAccessDrawer({
      open: true,
      role: { id: 'role-1', code: 'editor', name: '编辑' },
      activeTab: 'data-scope',
    });

    expect(state).toEqual({
      open: false,
      role: null,
      activeTab: 'data-scope',
    });
  });

  it('keeps permission tab selection when drawer closes', () => {
    const state = closeRoleAccessDrawer({
      open: true,
      role: { id: 'role-1', code: 'editor', name: '编辑' },
      activeTab: 'permission',
    });

    expect(state).toEqual({
      open: false,
      role: null,
      activeTab: 'permission',
    });
  });

  it('builds stable drawer title', () => {
    expect(getRoleAccessDrawerTitle('编辑')).toBe('角色权限配置 - 编辑');
  });

  it('creates closed initial state', () => {
    expect(createClosedRoleAccessDrawerState()).toEqual({
      open: false,
      role: null,
      activeTab: 'menu',
    });
  });
});

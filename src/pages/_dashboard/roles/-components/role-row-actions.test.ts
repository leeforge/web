import { describe, expect, it } from 'bun:test';
import { getDashboardRoutePermissions } from '@/config/route-permissions';
import { getRoleRowActionKeys } from './role-row-actions';

describe('role row actions', () => {
  it('shows consolidated access-config action for normal roles', () => {
    expect(getRoleRowActionKeys('editor')).toEqual([
      'edit',
      'access-config',
      'copy',
      'delete',
    ]);
  });

  it('blocks all actions for super_admin role', () => {
    expect(getRoleRowActionKeys('super_admin')).toEqual(['blocked']);
  });
});

describe('route permission metadata', () => {
  it('registers role menu config route with role.manage permission', () => {
    const row = getDashboardRoutePermissions()
      .find(item => item.route === '/roles/$roleId/menus');
    expect(row).toEqual({
      route: '/roles/$roleId/menus',
      name: '角色菜单配置',
      permission: 'role.manage',
      private: true,
    });
  });

  it('does not expose legacy /data-scope-policies route in governance metadata', () => {
    expect(getDashboardRoutePermissions().some(item => item.route === '/data-scope-policies')).toBe(false);
  });
});

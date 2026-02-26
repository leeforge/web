import { describe, expect, it } from 'bun:test';
import { getDashboardRoutePermissions, getMissingRoutePermissionItems } from './route-permissions';

describe('route permission coverage', () => {
  it('tracks dashboard route metadata for governance checks', () => {
    const rows = getDashboardRoutePermissions();
    expect(rows.length).toBeGreaterThan(0);

    const privateRows = rows.filter(item => item.private);
    expect(privateRows.length).toBeGreaterThan(0);
  });

  it('can detect routes that miss permission metadata', () => {
    const missing = getMissingRoutePermissionItems();
    expect(Array.isArray(missing)).toBe(true);
  });

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

  it('registers logs route with cms.audit.read permission', () => {
    const row = getDashboardRoutePermissions().find(item => item.route === '/logs');
    expect(row).toEqual({
      route: '/logs',
      name: '日志管理',
      permission: 'cms.audit.read',
      private: true,
    });
  });

  it('registers role permission config route with role.manage permission', () => {
    const row = getDashboardRoutePermissions()
      .find(item => item.route === '/roles/$roleId/permissions');

    expect(row).toEqual({
      route: '/roles/$roleId/permissions',
      name: '角色权限绑定',
      permission: 'role.manage',
      private: true,
    });
  });

  it('does not expose legacy /data-scope-policies route in governance metadata', () => {
    expect(getDashboardRoutePermissions().some(item => item.route === '/data-scope-policies')).toBe(false);
  });

  it('does not re-introduce removed routes', () => {
    const routes = getDashboardRoutePermissions().map(item => item.route);
    expect(routes).not.toContain('/audit');
    expect(routes).not.toContain('/platform/switch-logs');
    expect(routes).not.toContain('/platform/catalog');
  });
});

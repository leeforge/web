export interface RoutePermissionMeta {
  route: string;
  name: string;
  permission?: string;
  private: boolean;
}

const DASHBOARD_ROUTE_PERMISSIONS: RoutePermissionMeta[] = [
  { route: '/', name: '首页', permission: 'dashboard.read', private: true },
  { route: '/users', name: '用户管理', permission: 'user.manage', private: true },
  { route: '/apiKeys', name: 'API Keys', permission: 'apikey.manage', private: true },
  { route: '/tenants', name: '租户管理', permission: 'tenant.manage', private: true },
  { route: '/projects', name: '项目管理', permission: 'project.manage', private: true },
  { route: '/projects/$projectId/members', name: '项目成员管理', permission: 'project.manage', private: true },
  { route: '/organization', name: 'OU组织管理', permission: 'org.manage', private: true },
  { route: '/roles', name: '角色管理', permission: 'role.manage', private: true },
  { route: '/role-bindings', name: '角色绑定策略', permission: 'role.manage', private: true },
  { route: '/roles/$roleId/menus', name: '角色菜单配置', permission: 'role.manage', private: true },
  { route: '/roles/$roleId/permissions', name: '角色权限绑定', permission: 'role.manage', private: true },
  { route: '/roles/$roleId/data-scope', name: '数据范围配置', permission: 'role.manage', private: true },
  { route: '/permissions', name: '权限管理', permission: 'permission.manage', private: true },
  { route: '/security/route-permissions', name: '路由权限治理', permission: 'permission.manage', private: true },
  { route: '/menus', name: '菜单管理', permission: 'menu.manage', private: true },
  { route: '/dictionaries', name: '字典管理', permission: 'dictionary.manage', private: true },
  { route: '/media', name: '媒体管理', permission: 'cms.media.read', private: true },
  { route: '/logs', name: '日志管理', permission: 'cms.audit.read', private: true },
  { route: '/shares', name: '共享授权', permission: 'project.manage', private: true },
  { route: '/quotas/tenants', name: '租户配额', permission: 'tenant.manage', private: true },
  { route: '/quotas/projects', name: '项目配额', permission: 'project.manage', private: true },
  { route: '/system/mode', name: '系统模式配置', permission: 'tenant.manage', private: true },
  { route: '/platform/impersonation', name: '平台代管', permission: 'platform.impersonate', private: true },
  { route: '/profile', name: '个人信息', permission: 'profile.read', private: true },
  { route: '/settings', name: '系统设置', permission: 'system.settings', private: true },
  { route: '/schemaFormDemo', name: 'SchemaForm 演示', private: true },
  { route: '/schemaTableDemo', name: 'SchemaTable 演示', private: true },
];

export function getDashboardRoutePermissions() {
  return DASHBOARD_ROUTE_PERMISSIONS;
}

export function getMissingRoutePermissionItems() {
  return DASHBOARD_ROUTE_PERMISSIONS.filter(item => item.private && !item.permission);
}

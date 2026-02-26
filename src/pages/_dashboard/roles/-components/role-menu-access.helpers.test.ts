import { describe, expect, it } from 'bun:test';
import { extractRoleMenuIds, toMenuTreeData } from './role-menu-access.helpers';

describe('role menu access helpers', () => {
  it('extracts checked menu ids from menuIds and edges.menus with dedupe', () => {
    const ids = extractRoleMenuIds({
      menuIds: ['menu-dashboard', 'menu-users'],
      edges: {
        menus: [
          { id: 'menu-users' },
          { id: 'menu-roles' },
        ],
      },
    });

    expect(ids).toEqual(['menu-dashboard', 'menu-users', 'menu-roles']);
  });

  it('maps menu tree to antd tree data recursively', () => {
    const treeData = toMenuTreeData([
      {
        id: 'root',
        name: '系统管理',
        path: '/system',
        children: [{ id: 'roles', name: '角色管理', path: '/roles' }],
      } as any,
    ]);

    expect(treeData).toEqual([
      {
        key: 'root',
        value: 'root',
        title: '系统管理 (/system)',
        children: [
          {
            key: 'roles',
            value: 'roles',
            title: '角色管理 (/roles)',
            children: undefined,
          },
        ],
      },
    ]);
  });
});

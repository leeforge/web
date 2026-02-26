import { describe, expect, it } from 'bun:test';
import type { Menu } from '@/api/endpoints/menu.api';
import {
  buildSiderMenuNodes,
  normalizeMenuTreePayload,
  resolveSiderState,
} from './sider-menu.helpers';

describe('sider menu helpers', () => {
  it('builds visible menu nodes sorted by sort and keeps nested nodes', () => {
    const nodes = buildSiderMenuNodes([
      {
        id: 'system',
        name: '系统管理',
        path: '/system',
        sort: 20,
        children: [
          { id: 'menus', name: '菜单管理', path: '/menus', sort: 2 },
          { id: 'hidden', name: '隐藏菜单', path: '/hidden', sort: 1, hidden: true },
        ],
      },
      {
        id: 'home',
        name: '首页',
        path: '/',
        sort: 1,
      },
    ] as any);

    expect(nodes).toEqual([
      {
        key: '/',
        path: '/',
        title: '首页',
        icon: undefined,
        children: undefined,
      },
      {
        key: '/system',
        path: '/system',
        title: '系统管理',
        icon: undefined,
        children: [
          {
            key: '/menus',
            path: '/menus',
            title: '菜单管理',
            icon: undefined,
            children: undefined,
          },
        ],
      },
    ]);
  });

  it('resolves selected/open keys with longest prefix match', () => {
    const nodes = buildSiderMenuNodes([
      { id: 'home', name: '首页', path: '/' },
      {
        id: 'system',
        name: '系统管理',
        path: '/system',
        children: [{ id: 'roles', name: '角色管理', path: '/roles' }],
      },
    ] as any);

    expect(resolveSiderState(nodes, '/roles/role-1/menus')).toEqual({
      selectedKeys: ['/roles'],
      openKeys: ['/system'],
    });

    expect(resolveSiderState(nodes, '/unknown')).toEqual({
      selectedKeys: ['/'],
      openKeys: [],
    });
  });
});

describe('normalizeMenuTreePayload', () => {
  it('normalizes menus/tree payload used by list page and sider', () => {
    const fromQuery = normalizeMenuTreePayload({
      data: [{ id: 'menus', name: '菜单管理', path: '/menus' }],
    });
    expect((fromQuery as Menu[]).map(item => item.path)).toEqual(['/menus']);

    const fromDirectArray = normalizeMenuTreePayload([
      { id: 'roles', name: '角色管理', path: '/roles' },
    ]);
    expect((fromDirectArray as Menu[]).map(item => item.path)).toEqual(['/roles']);

    expect(normalizeMenuTreePayload(undefined)).toEqual([]);
  });
});

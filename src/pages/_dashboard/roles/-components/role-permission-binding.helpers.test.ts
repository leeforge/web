import { describe, expect, it } from 'bun:test';
import {
  buildSetRolePermissionsPayload,
  extractRolePermissionCodes,
  normalizePermissionBindingOptions,
  toPermissionTreeData,
} from './role-permission-binding.helpers';

describe('role permission binding helpers', () => {
  it('normalizes permission options from mixed payload shapes and dedupes by code', () => {
    const options = normalizePermissionBindingOptions({
      data: [
        { code: 'role.manage', description: '角色管理' },
        { permission: 'permission.manage', name: '权限管理' },
        'role.manage',
      ],
    } as any);

    expect(options).toEqual([
      { label: 'role.manage - 角色管理', value: 'role.manage' },
      { label: '权限管理', value: 'permission.manage' },
    ]);
  });

  it('extracts role permission codes with dedupe', () => {
    expect(extractRolePermissionCodes({
      permissions: ['role.manage', 'permission.manage', 'role.manage'],
    } as any)).toEqual(['role.manage', 'permission.manage']);
  });

  it('builds set-role-api payload and removes blank values', () => {
    expect(buildSetRolePermissionsPayload(['role.manage', '', 'permission.manage'])).toEqual({
      permissionCodes: ['role.manage', 'permission.manage'],
    });
  });

  it('builds permission tree data for checkable tree panel', () => {
    const treeData = toPermissionTreeData({
      data: [
        { code: 'cms.media.read', name: '媒体读取' },
        { code: 'cms.media.write', name: '媒体写入' },
        { code: 'role.manage', description: '角色管理' },
        'role.manage',
      ],
    } as any);

    expect(treeData).toEqual([
      {
        key: 'group:cms',
        title: 'cms',
        selectable: false,
        children: [
          {
            key: 'group:cms.media',
            title: 'media',
            selectable: false,
            children: [
              { key: 'cms.media.read', title: '媒体读取' },
              { key: 'cms.media.write', title: '媒体写入' },
            ],
          },
        ],
      },
      {
        key: 'group:role',
        title: 'role',
        selectable: false,
        children: [
          { key: 'role.manage', title: 'role.manage - 角色管理' },
        ],
      },
    ]);
  });
});

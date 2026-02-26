import { describe, expect, it } from 'bun:test';
import { CreateRoleParamsSchema, RoleSchema } from './role.api';

describe('RoleSchema menu fields', () => {
  it('keeps role menuIds when parsing role detail', () => {
    const parsed = RoleSchema.parse({
      id: 'role-1',
      name: '运营',
      code: 'operator',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      menuIds: ['menu-a', 'menu-b'],
    });

    expect(parsed.menuIds).toEqual(['menu-a', 'menu-b']);
  });

  it('keeps role edges.menus when parsing role detail', () => {
    const parsed = RoleSchema.parse({
      id: 'role-2',
      name: '审计员',
      code: 'auditor',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
      edges: {
        menus: [{ id: 'menu-a' }, { id: 'menu-b' }],
      },
    });

    expect(parsed.edges?.menus?.map(item => item.id)).toEqual(['menu-a', 'menu-b']);
  });
});

describe('role defaultDataScope schema', () => {
  it('parses defaultDataScope from role detail', () => {
    const role = RoleSchema.parse({
      id: 'role-1',
      name: '运营',
      code: 'operator',
      defaultDataScope: 'SELF',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    });
    expect(role.defaultDataScope).toBe('SELF');
  });

  it('allows ALL/SELF/OU_SELF/OU_SUBTREE in create payload', () => {
    expect(CreateRoleParamsSchema.parse({
      name: '审计员',
      code: 'auditor',
      defaultDataScope: 'OU_SELF',
    }).defaultDataScope).toBe('OU_SELF');

    expect(CreateRoleParamsSchema.parse({
      name: '审计员',
      code: 'auditor',
      defaultDataScope: 'OU_SUBTREE',
    }).defaultDataScope).toBe('OU_SUBTREE');
  });
});

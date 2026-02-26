import { describe, expect, it } from 'bun:test';
import { buildCreateRolePayload, buildUpdateRolePayload } from './role-form.helpers';

describe('role form payload helpers', () => {
  it('uses SELF as defaultDataScope by default when creating', () => {
    expect(buildCreateRolePayload({
      name: '编辑',
      code: 'editor',
      description: '',
      sort: 0,
      permissions: [],
    }).defaultDataScope).toBe('SELF');
  });

  it('does not include permissions in create payload', () => {
    const payload = buildCreateRolePayload({
      name: '编辑',
      code: 'editor',
      permissions: ['role.manage'],
    });

    expect(payload).not.toHaveProperty('permissions');
  });

  it('keeps explicit defaultDataScope when updating', () => {
    expect(buildUpdateRolePayload({
      name: '编辑',
      defaultDataScope: 'ALL',
    }).defaultDataScope).toBe('ALL');
  });

  it('does not include permissions in update payload', () => {
    const payload = buildUpdateRolePayload({
      name: '编辑',
      permissions: ['role.manage'],
    });

    expect(payload).not.toHaveProperty('permissions');
  });
});

import { describe, expect, it } from 'bun:test';
import {
  normalizeScopeType,
  RoleRuleScopeTypeSchema,
  toBackendScopeType,
  toLegacyRoleRuleScopeType,
} from './data-scope.api';

describe('data scope enum compatibility', () => {
  it('maps legacy scope values to new scope values', () => {
    expect(normalizeScopeType('TENANT_ALL')).toBe('TENANT');
    expect(normalizeScopeType('OU_SELF')).toBe('ORG_NODE');
    expect(normalizeScopeType('OU_SUBTREE')).toBe('ORG_SUBTREE');
    expect(normalizeScopeType('OU_LIST')).toBe('ORG_LIST');
    expect(normalizeScopeType('SELF')).toBe('SELF');
  });

  it('maps new scope values back to backend-compatible values', () => {
    expect(toBackendScopeType('TENANT')).toBe('TENANT_ALL');
    expect(toBackendScopeType('PROJECT')).toBe('PROJECT');
    expect(toBackendScopeType('ORG_NODE')).toBe('OU_SELF');
    expect(toBackendScopeType('ORG_SUBTREE')).toBe('OU_SUBTREE');
    expect(toBackendScopeType('ORG_LIST')).toBe('OU_LIST');
    expect(toBackendScopeType('SELF')).toBe('SELF');
  });
});

describe('role data-scope rule contract', () => {
  it('accepts ALL/SELF/OU_SELF/OU_SUBTREE only', () => {
    expect(RoleRuleScopeTypeSchema.parse('ALL')).toBe('ALL');
    expect(RoleRuleScopeTypeSchema.parse('OU_SELF')).toBe('OU_SELF');
    expect(() => RoleRuleScopeTypeSchema.parse('ORG_LIST')).toThrow();
  });

  it('maps UI-friendly values to backend values when needed', () => {
    expect(toLegacyRoleRuleScopeType('ALL')).toBe('ALL');
    expect(toLegacyRoleRuleScopeType('OU_SUBTREE')).toBe('OU_SUBTREE');
  });
});

import { describe, expect, it } from 'bun:test';
import { migratePersistedAuthState } from './auth';

describe('AuthStore persisted migration', () => {
  it('drops legacy tenant scope fields and keeps project migration only', () => {
    const migrated = migratePersistedAuthState({
      currentTenantId: 'default',
      currentProjectId: 'proj-1',
      accessToken: 'token-1',
    });

    expect(migrated.actingDomain).toBeNull();
    expect(migrated.selectedProjectId).toBe('proj-1');
    expect(migrated.currentTenantId).toBeUndefined();
    expect(migrated.currentProjectId).toBeUndefined();
  });

  it('does not map legacy selected tenant id to actingDomain', () => {
    const migrated = migratePersistedAuthState({
      selectedTenantId: 'tenant-school-a',
      selectedProjectId: null,
    });

    expect(migrated.actingDomain).toBeNull();
    expect(migrated.selectedTenantId).toBeUndefined();
  });

  it('keeps existing actingDomain when persisted data is already migrated', () => {
    const migrated = migratePersistedAuthState({
      actingDomain: {
        type: 'tenant',
        key: 'tenant-existing',
        source: 'explicit',
      },
      selectedProjectId: 'proj-existing',
    });

    expect(migrated.actingDomain).toEqual({
      type: 'tenant',
      key: 'tenant-existing',
      source: 'explicit',
    });
    expect(migrated.selectedProjectId).toBe('proj-existing');
  });
});

import { describe, expect, it } from 'bun:test';
import { mapMyDomainsToTenants } from './tenant.api';

describe('tenant domain mapping', () => {
  it('maps flat tenant domain payload to tenant options', () => {
    const tenants = mapMyDomainsToTenants([
      {
        domainType: 'tenant',
        domainKey: 'tenant-001',
        code: 'acme',
        displayName: 'ACME',
        role: 'owner',
        isDefault: true,
        status: 'active',
      },
    ]);

    expect(tenants).toEqual([
      {
        id: 'tenant-001',
        code: 'acme',
        name: 'ACME',
        role: 'owner',
        isDefault: true,
        status: 'active',
      },
    ]);
  });

  it('maps nested domain membership payload to tenant options', () => {
    const tenants = mapMyDomainsToTenants([
      {
        domain: {
          typeCode: 'tenant',
          key: 'tenant-002',
          displayName: 'Beta Team',
          status: 'active',
        },
        membership: {
          memberRole: 'member',
          isDefault: false,
        },
        tenant: {
          id: 'tenant-002',
          code: 'beta',
          name: 'Beta Team',
        },
      },
    ]);

    expect(tenants).toEqual([
      {
        id: 'tenant-002',
        code: 'beta',
        name: 'Beta Team',
        role: 'member',
        isDefault: false,
        status: 'active',
      },
    ]);
  });

  it('ignores non-tenant and invalid records', () => {
    const tenants = mapMyDomainsToTenants([
      {
        domainType: 'platform',
        domainKey: 'root',
      },
      {
        domainType: 'tenant',
      },
      null,
      'invalid',
    ]);

    expect(tenants).toEqual([]);
  });

  it('deduplicates same tenant key and keeps default marker', () => {
    const tenants = mapMyDomainsToTenants([
      {
        domainType: 'tenant',
        domainKey: 'tenant-003',
        code: 'gamma',
        displayName: 'Gamma',
        isDefault: false,
      },
      {
        domainType: 'tenant',
        domainKey: 'tenant-003',
        memberRole: 'admin',
        isDefault: true,
      },
    ]);

    expect(tenants).toEqual([
      {
        id: 'tenant-003',
        code: 'gamma',
        name: 'Gamma',
        role: 'admin',
        isDefault: true,
      },
    ]);
  });
});

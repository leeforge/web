import { Space } from 'antd';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useStore } from 'zustand';
import { getMyTenants } from '@/api/endpoints/tenant.api';
import { AuthStore, createTenantDomainContext, isTenantDomain } from '@/stores';
import { checkPlatformAdmin } from '@/utils';
import { TenantSelect } from './TenantSelect';
import { ProjectSelect } from './ProjectSelect';

export function ScopeSelector() {
  const user = useStore(AuthStore, state => state.user);
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  const setActingDomain = useStore(AuthStore, state => state.setActingDomain);
  const impersonation = useStore(AuthStore, state => state.impersonation);

  const isPlatformAdmin = checkPlatformAdmin(user);
  const isTenantScope = actingDomain?.type === 'tenant';

  const isDisabled = Boolean(impersonation);

  // Regular users: auto-select first tenant if none persisted
  // Guard: wait for user to load before enabling query or auto-select,
  // otherwise platform admins may be misidentified during initial render.
  const myTenantsQuery = useQuery({
    queryKey: ['domains', 'mine'],
    queryFn: () => getMyTenants(),
    enabled: Boolean(user) && !isPlatformAdmin,
    retry: false,
  });

  useEffect(() => {
    if (!user || isPlatformAdmin) {
      return;
    }
    const tenants = myTenantsQuery.data?.data?.tenants;
    if (!tenants || tenants.length === 0) {
      return;
    }
    if (!isTenantDomain(actingDomain)) {
      const defaultTenant = tenants.find(tenant => tenant.isDefault) || tenants[0];
      setActingDomain(createTenantDomainContext(defaultTenant.id, 'default', defaultTenant.name));
    }
  }, [user, isPlatformAdmin, myTenantsQuery.data?.data?.tenants, actingDomain, setActingDomain]);

  return (
    <Space size="middle">
      <TenantSelect disabled={isDisabled} />
      {isTenantScope && (
        <ProjectSelect disabled={isDisabled} />
      )}
    </Space>
  );
}

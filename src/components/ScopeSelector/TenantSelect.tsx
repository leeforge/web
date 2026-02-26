import type { DefaultOptionType } from 'antd/es/select';
import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { Select, Spin, Tag } from 'antd';
import { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import { getMyTenants, getTenantList } from '@/api/endpoints/tenant.api';
import { AuthStore, createPlatformDomainContext, createTenantDomainContext } from '@/stores';
import { checkPlatformAdmin } from '@/utils';

const PLATFORM_VALUE = 'platform:root';
const TENANT_PREFIX = 'tenant:';

function toTenantOptionValue(tenantId: string): string {
  return `${TENANT_PREFIX}${tenantId}`;
}

function parseDomainSelection(value: string) {
  if (value === PLATFORM_VALUE) {
    return createPlatformDomainContext('explicit');
  }

  const separator = value.indexOf(':');
  if (separator <= 0 || separator >= value.length - 1) {
    return createPlatformDomainContext('explicit');
  }

  const type = value.slice(0, separator);
  const key = value.slice(separator + 1);
  if (type === 'tenant') {
    return createTenantDomainContext(key, 'explicit');
  }

  return {
    type,
    key,
    source: 'explicit' as const,
  };
}

export function TenantSelect({ disabled }: { disabled?: boolean }) {
  const queryClient = useQueryClient();
  const user = useStore(AuthStore, state => state.user);
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  const setActingDomain = useStore(AuthStore, state => state.setActingDomain);

  const isPlatformAdmin = checkPlatformAdmin(user);
  const isTenantScope = actingDomain?.type === 'tenant';

  const [tenantSearch, setTenantSearch] = useState('');

  const userLoaded = Boolean(user);

  const tenantListQuery = useQuery({
    queryKey: ['tenants', 'list', tenantSearch],
    queryFn: () => getTenantList({
      page: 1,
      pageSize: 50,
      query: tenantSearch || undefined,
    }),
    enabled: userLoaded && isPlatformAdmin,
    retry: false,
  });

  const myTenantsQuery = useQuery({
    queryKey: ['domains', 'mine'],
    queryFn: () => getMyTenants(),
    enabled: userLoaded && !isPlatformAdmin,
    retry: false,
  });

  const selectValue = useMemo(() => {
    if (!actingDomain) {
      return isPlatformAdmin ? PLATFORM_VALUE : undefined;
    }
    if (actingDomain.type === 'platform') {
      return PLATFORM_VALUE;
    }
    if (actingDomain.type === 'tenant') {
      return toTenantOptionValue(actingDomain.key);
    }
    return `${actingDomain.type}:${actingDomain.key}`;
  }, [actingDomain, isPlatformAdmin]);

  const scopeTag = actingDomain?.type === 'platform'
    ? <Tag color="blue" className="m-0">平台</Tag>
    : isTenantScope
      ? <Tag color="green" className="m-0">租户</Tag>
      : null;

  const handleChange = (value: string) => {
    setActingDomain(parseDomainSelection(value));
    queryClient.invalidateQueries({ queryKey: ['projects'] });
    queryClient.invalidateQueries({ queryKey: ['data-scope-policies'] });
    queryClient.invalidateQueries({ queryKey: ['governance'] });
  };

  const options = useMemo(() => {
    if (isPlatformAdmin) {
      const tenants = tenantListQuery.data?.data?.data ?? [];
      return [
        { value: PLATFORM_VALUE, label: '平台范围' },
        ...tenants.map(t => ({
          value: toTenantOptionValue(t.id),
          label: `${t.name} (${t.code || t.id})`,
        })),
      ];
    }

    const tenants = myTenantsQuery.data?.data?.tenants ?? [];
    return tenants.map(t => ({
      value: toTenantOptionValue(t.id),
      label: `${t.name} (${t.code || t.id})`,
    }));
  }, [isPlatformAdmin, tenantListQuery.data?.data?.data, myTenantsQuery.data?.data?.tenants]);

  const loading = isPlatformAdmin
    ? tenantListQuery.isFetching
    : myTenantsQuery.isFetching;

  const renderOption = (option: DefaultOptionType) => {
    if (option.value === PLATFORM_VALUE) {
      return (
        <span className="flex items-center gap-1 font-medium text-blue-600">
          <span className="i-line-md-home text-sm" />
          {option.label}
        </span>
      );
    }
    return option.label;
  };

  return (
    <div className="flex items-center gap-1.5">
      {scopeTag}
      <Select
        showSearch={isPlatformAdmin}
        filterOption={isPlatformAdmin ? false : undefined}
        onSearch={isPlatformAdmin ? setTenantSearch : undefined}
        value={selectValue}
        onChange={handleChange}
        options={options}
        optionRender={({ data }) => renderOption(data)}
        loading={loading}
        disabled={disabled}
        placeholder="选择范围"
        className="min-w-40"
        notFoundContent={loading ? <Spin size="small" /> : '暂无数据'}
        popupMatchSelectWidth={false}
      />
    </div>
  );
}

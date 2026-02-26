import { useQuery } from '@tanstack/react-query';
import { Select, Spin } from 'antd';
import { useMemo } from 'react';
import { useStore } from 'zustand';
import { getProjectList } from '@/api/endpoints/project.api';
import { isGovernanceApiSupported } from '@/api/endpoints/governance-contract.api';
import { AuthStore } from '@/stores';

export function ProjectSelect({ disabled }: { disabled?: boolean }) {
  const actingDomain = useStore(AuthStore, state => state.actingDomain);
  const selectedProjectId = useStore(AuthStore, state => state.selectedProjectId);
  const setSelectedProjectId = useStore(AuthStore, state => state.setSelectedProjectId);
  const isTenantScope = actingDomain?.type === 'tenant';

  const projectApiSupported = isGovernanceApiSupported('project');

  const myProjectsQuery = useQuery({
    queryKey: ['projects', 'mine', actingDomain?.type, actingDomain?.key],
    queryFn: () => getProjectList({
      page: 1,
      pageSize: 200,
      status: 'active',
    }),
    enabled: projectApiSupported && isTenantScope,
    retry: false,
  });

  const options = useMemo(() => {
    if (!projectApiSupported) {
      return [];
    }
    const projects = myProjectsQuery.data?.data?.data ?? [];
    return projects.map(p => ({
      value: p.id,
      label: `${p.name} (${p.code})`,
    }));
  }, [projectApiSupported, myProjectsQuery.data?.data?.data]);

  if (!projectApiSupported) {
    return null;
  }

  return (
    <Select
      value={selectedProjectId}
      onChange={(value: string | undefined) => setSelectedProjectId(value ?? null)}
      options={options}
      allowClear
      disabled={disabled}
      placeholder="选择项目"
      className="min-w-36"
      loading={myProjectsQuery.isFetching}
      notFoundContent={myProjectsQuery.isFetching ? <Spin size="small" /> : '暂无项目'}
      popupMatchSelectWidth={false}
    />
  );
}

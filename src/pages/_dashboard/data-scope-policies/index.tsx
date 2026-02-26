import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { DataScopePolicyFormRef } from './-components/DataScopePolicyForm';
import type { DataScopePolicy, DataScopePolicyListParams, ScopeTypeLike } from '@/api/endpoints/data-scope.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Modal, Tag } from 'antd';
import { useMemo, useRef } from 'react';
import { useStore } from 'zustand';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  deletePolicy,
  listPolicies,
  normalizeScopeType,
  ScopeTypeLabels,
} from '@/api/endpoints/data-scope.api';
import { getRoleList } from '@/api/endpoints/role.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { AuthStore } from '@/stores';
import { DataScopePolicyForm } from './-components/DataScopePolicyForm';

export const Route = createFileRoute('/_dashboard/data-scope-policies/')({
  component: RouteComponent,
});

function formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }
  const ts = Date.parse(value);
  if (Number.isNaN(ts)) {
    return value;
  }
  return new Date(ts).toLocaleString('zh-CN');
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const formRef = useRef<DataScopePolicyFormRef>(null);
  const actingDomain = useStore(AuthStore, state => state.actingDomain);

  const rolesQuery = useQuery({
    queryKey: ['roles', 'list', 'scope-policy-options'],
    queryFn: async () => {
      const response = await getRoleList({ page: 1, pageSize: 200 });
      return normalizePaginatedPayload(response, {
        listKeys: ['items', 'data'],
        defaultPageSize: 200,
      });
    },
  });

  const roleMap = useMemo(() => {
    const map = new Map<string, string>();
    (rolesQuery.data?.list || []).forEach((role: any) => {
      map.set(role.code, role.name);
    });
    return map;
  }, [rolesQuery.data?.list]);

  const table = useProTableQuery<DataScopePolicy, DataScopePolicyListParams>({
    useQuery,
    queryKey: ['data-scope-policies', actingDomain?.type, actingDomain?.key],
    queryFn: params => listPolicies(params).then(response => normalizePaginatedPayload<DataScopePolicy>(response, {
      listKeys: ['items'],
      defaultPageSize: 20,
    })),
    initialPagination: { pageSize: 20 },
    keepPreviousData: true,
    paramsTransform: (params) => {
      const next = { ...params } as Record<string, unknown>;
      if (!params.roleCode) {
        delete next.roleCode;
      }
      if (!params.resourceKey) {
        delete next.resourceKey;
      }
      return next;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-scope-policies'] });
    },
  });

  const columns: ColumnsType<DataScopePolicy> = [
    {
      title: '角色',
      dataIndex: 'roleCode',
      key: 'roleCode',
      width: 220,
      render: (value: string) => {
        const roleName = roleMap.get(value);
        if (!roleName) {
          return <Tag>{value}</Tag>;
        }
        return (
          <span>
            {roleName}
            {' '}
            <Tag>{value}</Tag>
          </span>
        );
      },
    },
    {
      title: '资源标识',
      dataIndex: 'resourceKey',
      key: 'resourceKey',
      width: 220,
    },
    {
      title: '范围类型',
      dataIndex: 'scopeType',
      key: 'scopeType',
      width: 180,
      render: (value: ScopeTypeLike) => {
        const normalized = normalizeScopeType(value);
        return <Tag color="blue">{ScopeTypeLabels[normalized]}</Tag>;
      },
    },
    {
      title: '范围值',
      dataIndex: 'scopeValue',
      key: 'scopeValue',
      render: (value?: string | null) => value || '-',
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      fixed: 'right',
      render: (_, record) => {
        const items: ActionItem<DataScopePolicy>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => formRef.current?.open({ data: record }),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            disabled: deleteMutation.isPending,
            onClick: () => {
              Modal.confirm({
                title: '确认删除策略',
                content: '删除后将立即影响对应资源的数据可见范围，是否继续？',
                okText: '确认删除',
                cancelText: '取消',
                okButtonProps: { danger: true },
                onOk: async () => {
                  await deleteMutation.mutateAsync(record.id);
                },
              });
            },
          },
        ];
        return <RowActionBar items={items} context={record} />;
      },
    },
  ];

  const searchFields: ProTableSearchField<DataScopePolicyListParams>[] = [
    {
      name: 'roleCode',
      label: '角色编码',
      placeholder: '请输入角色编码',
    },
    {
      name: 'resourceKey',
      label: '资源标识',
      placeholder: '请输入资源标识',
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<DataScopePolicy, DataScopePolicyListParams>
        rowKey="id"
        columns={columns}
        data={table.data}
        loading={table.loading}
        pagination={table.pagination}
        pageSizeOptions={[10, 20, 50, 100]}
        onPaginationChange={table.onPaginationChange}
        search={{
          fields: searchFields,
          values: table.search.values,
          onChange: table.search.onChange,
          onSubmit: table.search.onSubmit,
          onReset: table.search.onReset,
        }}
        onRefresh={table.onRefresh}
        actions={(
          <Button
            type="primary"
            icon={<CustomIcon icon="line-md:plus" width={16} />}
            onClick={() => formRef.current?.open()}
          >
            新建策略
          </Button>
        )}
      />

      <DataScopePolicyForm
        ref={formRef}
        onSuccess={table.onRefresh}
      />
    </div>
  );
}

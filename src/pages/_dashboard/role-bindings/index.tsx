import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { RoleBindingFormRef } from './-components/RoleBindingForm';
import type { RoleBinding, RoleBindingListParams } from '@/api/endpoints/role-binding.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Button, Modal, Space, Tag } from 'antd';
import { useRef } from 'react';
import { useStore } from 'zustand';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import { deleteRoleBinding, getRoleBindingList } from '@/api/endpoints/role-binding.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks';
import { AuthStore } from '@/stores';
import { RoleBindingForm } from './-components/RoleBindingForm';

interface BindingSearchParams {
  q?: string;
}

export const Route = createFileRoute('/_dashboard/role-bindings/')({
  component: RouteComponent,
});

function RouteComponent() {
  const queryClient = useQueryClient();
  const formRef = useRef<RoleBindingFormRef>(null);
  const { msgSuccess, msgError } = useMsg();
  const actingDomain = useStore(AuthStore, state => state.actingDomain);

  const table = useProTableQuery<RoleBinding, BindingSearchParams>({
    useQuery,
    queryKey: ['governance', 'role-bindings', actingDomain?.type, actingDomain?.key],
    queryFn: async (params) => {
      const queryParams: RoleBindingListParams = {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        scopeDomain: actingDomain?.type || undefined,
        scopeId: actingDomain?.key || undefined,
      };
      const response = await getRoleBindingList(queryParams);
      return normalizePaginatedPayload<RoleBinding>(response, {
        defaultPageSize: queryParams.pageSize,
      });
    },
    initialPagination: { pageSize: 20 },
    keepPreviousData: true,
    paramsTransform: (params) => {
      const next = { ...params } as Record<string, unknown>;
      if (!params.q) {
        delete next.q;
      }
      return next;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRoleBinding(id),
    onSuccess: () => {
      msgSuccess('角色绑定删除成功');
      queryClient.invalidateQueries({ queryKey: ['governance', 'role-bindings'] });
    },
    onError: (error: Error) => {
      msgError(error.message || '角色绑定删除失败');
    },
  });

  const handleDelete = (binding: RoleBinding) => {
    Modal.confirm({
      title: '确认删除绑定',
      content: `确定要删除主体 "${binding.subjectId}" 的角色绑定吗？`,
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        await deleteMutation.mutateAsync(binding.id);
      },
    });
  };

  const columns: ColumnsType<RoleBinding> = [
    {
      title: '主体',
      key: 'subject',
      render: (_, record) => (
        <div>
          <Tag color="geekblue">{record.subjectType}</Tag>
          <span>{record.subjectId}</span>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'roleCode',
      key: 'roleCode',
      render: (_, record) => <Tag color="blue">{record.roleCode || record.roleId || '-'}</Tag>,
    },
    {
      title: '范围',
      key: 'scope',
      render: (_, record) => (
        <Space size="small">
          <Tag>{`${record.scopeDomain}:${record.scopeId}`}</Tag>
          <Tag color="purple">{record.scopeType}</Tag>
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: value => (
        <Tag color={value === 'active' ? 'green' : 'default'}>
          {value === 'active' ? '启用' : '停用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => {
        const actionItems: ActionItem<RoleBinding>[] = [
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
            onClick: () => handleDelete(record),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={record}
          />
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<BindingSearchParams>[] = [
    {
      name: 'q',
      label: '关键词',
      placeholder: '按主体/角色/范围搜索',
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<RoleBinding, BindingSearchParams>
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
            新建绑定
          </Button>
        )}
      />

      <RoleBindingForm
        ref={formRef}
        onSuccess={table.onRefresh}
      />
    </div>
  );
}

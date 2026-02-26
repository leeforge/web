import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { TenantFormRef } from './TenantForm';
import type { Tenant, TenantListParams } from '@/api/endpoints/tenant.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Modal,
  Tag,
} from 'antd';
import { useRef, useState } from 'react';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  deleteTenant,
  getTenantList,
} from '@/api/endpoints/tenant.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks';
import { TenantForm } from './TenantForm';
import { TenantUsersModal } from './TenantUsersModal';

/**
 * 租户列表页面
 */
export function TenantsListPage() {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();

  // 表单状态
  const formRef = useRef<TenantFormRef>(null);

  // 成员管理弹窗状态
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [activeTenant, setActiveTenant] = useState<Tenant | undefined>();

  // 获取租户列表
  const table = useProTableQuery<Tenant, TenantListParams>({
    useQuery,
    queryKey: ['tenants'],
    queryFn: params => getTenantList(params as TenantListParams),
    resultTransform: data => normalizePaginatedPayload<Tenant>(data, {
      listKeys: ['tenants'],
      defaultPageSize: 20,
    }),
    initialPagination: { pageSize: 20 },
    keepPreviousData: true,
    paramsTransform: (params) => {
      const next = { ...params } as Record<string, unknown>;
      if (!params.query) {
        delete next.query;
      }
      if (!params.status) {
        delete next.status;
      }
      return next;
    },
  });

  // 删除租户 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      msgSuccess('租户删除成功');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: any) => {
      msgError(`删除失败: ${error.message}`);
    },
  });

  // 删除确认
  const handleDelete = (tenant: Tenant) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>
            确定要删除租户 "
            {tenant.name}
            " 吗？
          </p>
          <p className="text-textSecondary text-sm mt-2">
            删除后该租户下的资源将不可访问，请谨慎操作。
          </p>
        </div>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(tenant.id),
    });
  };

  // 打开新建表单
  const handleCreate = () => {
    formRef.current?.open();
  };

  // 打开编辑表单
  const handleEdit = (tenant: Tenant) => {
    formRef.current?.open({ data: tenant });
  };

  // 打开成员管理
  const handleManageUsers = (tenant: Tenant) => {
    setActiveTenant(tenant);
    setUsersModalOpen(true);
  };

  // 关闭成员管理
  const handleCloseUsersModal = () => {
    setUsersModalOpen(false);
    setActiveTenant(undefined);
  };

  const columns: ColumnsType<Tenant> = [
    {
      title: '租户名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, tenant: Tenant) => (
        <div>
          <div className="font-medium text-textBaseColor">{name}</div>
          {tenant.description && (
            <div className="text-textSecondary text-xs mt-1 line-clamp-2">
              {tenant.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '租户编码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Tag color="blue">{code}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status?: string) => {
        const statusConfig = {
          active: { color: 'success', text: '启用' },
          inactive: { color: 'default', text: '禁用' },
        } as const;
        const config = status ? statusConfig[status as keyof typeof statusConfig] : undefined;
        if (config) {
          return <Tag color={config.color}>{config.text}</Tag>;
        }
        return <Tag color="processing">{status || '未知'}</Tag>;
      },
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      key: 'ownerId',
      render: (ownerId?: string) => ownerId || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date?: string) => (date ? new Date(date).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_, tenant: Tenant) => {
        const actionItems: ActionItem<Tenant>[] = [
          {
            key: 'members',
            label: '成员',
            onClick: () => handleManageUsers(tenant),
          },
          {
            key: 'edit',
            label: '编辑',
            onClick: () => handleEdit(tenant),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            disabled: deleteMutation.isPending,
            onClick: () => handleDelete(tenant),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={tenant}
          />
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<TenantListParams>[] = [
    {
      name: 'query',
      label: '关键词',
      placeholder: '搜索租户名称或编码',
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '启用', value: 'active' },
        { label: '禁用', value: 'inactive' },
      ],
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<Tenant, TenantListParams>
        columns={columns}
        data={table.data}
        loading={table.loading}
        rowKey="id"
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
            onClick={handleCreate}
          >
            新建租户
          </Button>
        )}
      />

      {/* 新建/编辑表单弹窗 */}
      <TenantForm ref={formRef} />

      {/* 成员管理弹窗 */}
      <TenantUsersModal
        open={usersModalOpen}
        tenant={activeTenant}
        onClose={handleCloseUsersModal}
      />
    </div>
  );
}

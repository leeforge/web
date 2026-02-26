import type { ActionItem } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type {
  Tenant,
  TenantUser,
  TenantUserListParams,
} from '@/api/endpoints/tenant.api';
import type { User } from '@/api/endpoints/user.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Divider,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  addTenantUser,
  getTenantUsers,
  removeTenantUser,
} from '@/api/endpoints/tenant.api';
import { getUserList } from '@/api/endpoints/user.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks';

interface TenantUsersModalProps {
  tenant?: Tenant;
  open: boolean;
  onClose: () => void;
}

export function TenantUsersModal({ tenant, open, onClose }: TenantUsersModalProps) {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError, msgWarning } = useMsg();
  const tenantId = tenant?.id ?? '';

  const [selectedUserId, setSelectedUserId] = useState<string | undefined>();
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    if (!open) {
      setSelectedUserId(undefined);
      setUserSearch('');
    }
  }, [open, tenantId]);

  const table = useProTableQuery<TenantUser, TenantUserListParams>({
    useQuery,
    queryKey: ['tenants', tenantId, 'users'],
    queryFn: params => getTenantUsers(tenantId, params as TenantUserListParams),
    resultTransform: data => normalizePaginatedPayload<TenantUser>(data, {
      listKeys: ['users'],
      defaultPageSize: 10,
    }),
    initialPagination: { pageSize: 10 },
    keepPreviousData: true,
    enabled: open && !!tenantId,
  });

  const userOptionsQuery = useQuery({
    queryKey: ['users', 'options', userSearch],
    queryFn: () => getUserList({
      page: 1,
      pageSize: 20,
      q: userSearch || undefined,
    }),
    enabled: open,
    keepPreviousData: true,
  });

  const userOptions = useMemo(() => {
    const normalized = normalizePaginatedPayload<User>(userOptionsQuery.data, {
      listKeys: ['users'],
      defaultPageSize: 20,
    });
    const list = normalized.list;
    return list.map(user => ({
      label: `${user.username}${user.email ? ` (${user.email})` : ''}`,
      value: user.id,
    }));
  }, [userOptionsQuery.data]);

  const addMutation = useMutation({
    mutationFn: (payload: { tenantId: string; userId: string }) =>
      addTenantUser(payload.tenantId, { userId: payload.userId }),
    onSuccess: () => {
      msgSuccess('成员添加成功');
      setSelectedUserId(undefined);
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId, 'users'] });
    },
    onError: (error: any) => {
      msgError(`添加失败: ${error.message}`);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (payload: { tenantId: string; userId: string }) =>
      removeTenantUser(payload.tenantId, payload.userId),
    onSuccess: () => {
      msgSuccess('成员已移除');
      queryClient.invalidateQueries({ queryKey: ['tenants', tenantId, 'users'] });
    },
    onError: (error: any) => {
      msgError(`移除失败: ${error.message}`);
    },
  });

  const handleAddUser = () => {
    if (!tenantId) {
      msgWarning('租户信息缺失');
      return;
    }
    if (!selectedUserId) {
      msgWarning('请选择要添加的用户');
      return;
    }
    addMutation.mutate({ tenantId, userId: selectedUserId });
  };

  const handleRemoveUser = (user: TenantUser) => {
    if (!tenantId) {
      msgWarning('租户信息缺失');
      return;
    }
    const targetUserId = user.userId || user.id;
    if (!targetUserId) {
      msgWarning('无法识别用户 ID');
      return;
    }
    Modal.confirm({
      title: '确认移除',
      content: `确定要将用户 "${user.username || user.email || targetUserId}" 从该租户中移除吗？`,
      okText: '确认移除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => removeMutation.mutate({ tenantId, userId: targetUserId }),
    });
  };

  const columns: ColumnsType<TenantUser> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string | undefined, user: TenantUser) => (
        <div>
          <div className="font-medium text-textBaseColor">{username || user.email || '-'}</div>
          {user.nickname && (
            <div className="text-textSecondary text-xs mt-1">
              {user.nickname}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (email?: string) => email || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role?: string) => role ? <Tag color="blue">{role}</Tag> : '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status?: string) => {
        const statusConfig = {
          active: { color: 'success', text: '正常' },
          inactive: { color: 'default', text: '禁用' },
          suspended: { color: 'error', text: '冻结' },
        } as const;
        const config = status ? statusConfig[status as keyof typeof statusConfig] : undefined;
        if (config) {
          return <Tag color={config.color}>{config.text}</Tag>;
        }
        return <Tag color="processing">{status || '未知'}</Tag>;
      },
    },
    {
      title: '默认租户',
      dataIndex: 'isDefault',
      key: 'isDefault',
      render: (isDefault?: boolean) => (
        isDefault ? <Tag color="gold">默认</Tag> : '-'
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, user: TenantUser) => {
        const actionItems: ActionItem<TenantUser>[] = [
          {
            key: 'remove',
            label: '移除',
            danger: true,
            disabled: removeMutation.isPending,
            onClick: () => handleRemoveUser(user),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={user}
          />
        );
      },
    },
  ];

  return (
    <Modal
      title={(
        <Space>
          <span>租户成员管理</span>
          {tenant?.name && (
            <Typography.Text type="secondary">
              {tenant.name}
            </Typography.Text>
          )}
        </Space>
      )}
      open={open}
      onCancel={onClose}
      footer={null}
      width={900}
      destroyOnClose
    >
      <div className="mt-2">
        <div className="flex items-center gap-3">
          <Select
            showSearch
            allowClear
            placeholder="搜索用户（用户名或邮箱）"
            className="flex-1"
            options={userOptions}
            filterOption={false}
            value={selectedUserId}
            onSearch={setUserSearch}
            onChange={value => setSelectedUserId(value as string | undefined)}
            loading={userOptionsQuery.isFetching}
            notFoundContent={userOptionsQuery.isFetching ? <Spin size="small" /> : undefined}
          />
          <Button
            type="primary"
            icon={<CustomIcon icon="line-md:account-add" width={16} />}
            onClick={handleAddUser}
            loading={addMutation.isPending}
          >
            添加成员
          </Button>
        </div>

        <Divider className="my-4" />

        <ProTable<TenantUser, TenantUserListParams>
          columns={columns}
          data={table.data}
          loading={table.loading}
          rowKey={record => record.userId || record.id}
          pagination={table.pagination}
          pageSizeOptions={[10, 20, 50]}
          onPaginationChange={table.onPaginationChange}
        />
      </div>
    </Modal>
  );
}

import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { InvitationLinkModalRef } from './InvitationLinkModal';
import type { InviteUserFormRef } from './InviteUserForm';
import type { UserFormRef } from './UserForm';
import type { InvitationResponse, User, UserListParams } from '@/api/endpoints/user.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  Button,
  Input,
  message,
  Modal,
  Space,
  Tag,
} from 'antd';
import { useRef } from 'react';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  createPasswordResetToken,
  deleteUser,
  freezeUser,
  getUserList,
  restoreUser,
} from '@/api/endpoints/user.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { InvitationLinkModal } from './InvitationLinkModal';
import { InviteUserForm } from './InviteUserForm';
import { UserForm } from './UserForm';

/**
 * 用户列表页面
 */
export function UsersListPage() {
  const queryClient = useQueryClient();

  const inviteFormRef = useRef<InviteUserFormRef>(null);
  const invitationModalRef = useRef<InvitationLinkModalRef>(null);
  const userFormRef = useRef<UserFormRef>(null);

  // 获取用户列表
  const table = useProTableQuery<User, UserListParams>({
    useQuery,
    queryKey: ['users'],
    queryFn: params => getUserList(params).then(res => normalizePaginatedPayload(res, { defaultPageSize: 20 })),
    initialPagination: { pageSize: 20 },
    keepPreviousData: true,
    paramsTransform: (params) => {
      const next = { ...params };
      if (!params.q) {
        delete next.q;
      }
      if (!params.status) {
        delete next.status;
      }
      return next;
    },
  });

  // 删除用户 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      message.success('用户删除成功');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`);
    },
  });

  // 冻结用户 mutation
  const freezeMutation = useMutation({
    mutationFn: freezeUser,
    onSuccess: () => {
      message.success('用户已冻结');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      message.error(`冻结失败: ${error.message}`);
    },
  });

  // 恢复用户 mutation
  const restoreMutation = useMutation({
    mutationFn: restoreUser,
    onSuccess: () => {
      message.success('用户已恢复');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: any) => {
      message.error(`恢复失败: ${error.message}`);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: createPasswordResetToken,
    onError: (error: any) => {
      message.error(`重置密码链接生成失败: ${error.message}`);
    },
  });

  // 删除确认
  const handleDelete = (user: User) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 "${user.username}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(user.id),
    });
  };

  // 冻结/恢复确认
  const handleToggleFreeze = (user: User) => {
    const isSuspended = user.status === 'suspended';
    Modal.confirm({
      title: isSuspended ? '确认恢复' : '确认冻结',
      content: `确定要${isSuspended ? '恢复' : '冻结'}用户 "${user.username}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: !isSuspended },
      onOk: () => {
        if (isSuspended) {
          restoreMutation.mutate(user.id);
        }
        else {
          freezeMutation.mutate(user.id);
        }
      },
    });
  };

  // 打开邀请表单
  const handleInvite = () => {
    inviteFormRef.current?.open();
  };

  // 打开编辑表单
  const handleEdit = (user: User) => {
    userFormRef.current?.open({ data: user });
  };

  // 邀请成功回调
  const handleInviteSuccess = (invitationData: InvitationResponse) => {
    const link = new URL('/invite/activate', window.location.origin);
    link.searchParams.set('inviteJwt', invitationData.inviteJwt);
    invitationModalRef.current?.open({
      data: {
        invitationLink: link.toString(),
        expiresAt: invitationData.expiresAt,
      },
    });
    queryClient.invalidateQueries({ queryKey: ['users'] });
  };

  const showCopyableLinkModal = (opts: {
    title: string;
    messageText: string;
    link: string;
    expiresAt?: string;
  }) => {
    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(opts.link);
        message.success('链接已复制到剪贴板');
      }
      catch {
        message.error('复制失败，请手动复制');
      }
    };

    Modal.info({
      title: opts.title,
      okText: '关闭',
      content: (
        <div className="mt-3">
          <div className="mb-3 text-sm text-textSecondary">{opts.messageText}</div>
          <Space.Compact className="w-full">
            <Input value={opts.link} readOnly className="flex-1" />
            <Button type="primary" onClick={handleCopy}>复制链接</Button>
          </Space.Compact>
          {opts.expiresAt
            ? (
                <div className="mt-2 text-xs text-textSecondary">
                  有效期至：
                  {new Date(opts.expiresAt).toLocaleString('zh-CN', { hour12: false })}
                </div>
              )
            : null}
        </div>
      ),
    });
  };

  const handleResetPassword = async (user: User) => {
    const res = await resetPasswordMutation.mutateAsync(user.id);
    const link = new URL('/password/reset', window.location.origin);
    link.searchParams.set('resetJwt', res.data.resetJwt);
    showCopyableLinkModal({
      title: '重置密码链接已生成',
      messageText: `用户 "${user.username}" 的重置密码链接已生成。`,
      link: link.toString(),
      expiresAt: res.data.expiresAt,
    });
  };

  const handleResetInvitation = (user: User) => {
    inviteFormRef.current?.open({
      data: {
        username: user.username,
        email: user.email,
        domainType: user.tenantId ? 'tenant' : 'platform',
        domainKey: user.tenantId || 'root',
        roleIds: user.roles?.map(role => role.id) || [],
      },
    });
    message.info(`已预填 "${user.username}" 的信息，请确认后创建新邀请链接`);
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 160,
      render: (username: string, user: User) => (
        <Space>
          <Avatar size="small" src={user.avatar}>
            {username.charAt(0).toUpperCase()}
          </Avatar>
          <span>{username}</span>
        </Space>
      ),
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      width: 140,
      render: (nickname: string) => nickname || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 160,
      render: (phone: string) => phone || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'success', text: '正常' },
          suspended: { color: 'error', text: '冻结' },
          inactive: { color: 'default', text: '未激活' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 160,
      render: (roles: User['roles']) => {
        if (!roles || roles.length === 0)
          return '-';
        return (
          <Space size="small">
            {roles.map(role => (
              <Tag key={role.id} color="blue">
                {role.name}
              </Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, user: User) => {
        const isSuspended = user.status === 'suspended';
        const isInactive = user.status === 'inactive';
        const isSuperAdmin = user.isSuperAdmin;
        const actionItems: ActionItem<User>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => handleEdit(user),
          },
          {
            key: 'reset-invitation',
            label: '重置邀请链接',
            show: isInactive,
            onClick: () => handleResetInvitation(user),
          },
          {
            key: 'reset-password',
            label: '重置密码',
            onClick: () => void handleResetPassword(user),
          },
          {
            key: 'toggle',
            label: isSuspended ? '恢复' : '冻结',
            danger: !isSuspended,
            disabled: isInactive || isSuperAdmin,
            show: !isSuperAdmin,
            onClick: () => handleToggleFreeze(user),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            disabled: deleteMutation.isPending || isSuperAdmin,
            show: !isSuperAdmin,
            onClick: () => handleDelete(user),
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

  const searchFields: ProTableSearchField<UserListParams>[] = [
    {
      name: 'q',
      label: '关键词',
      placeholder: '搜索用户名、邮箱或手机号',
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '正常', value: 'active' },
        { label: '冻结', value: 'suspended' },
        { label: '未激活', value: 'inactive' },
      ],
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<User, UserListParams>
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
            onClick={handleInvite}
          >
            邀请用户
          </Button>
        )}
      />

      {/* 邀请用户表单弹窗 */}
      <InviteUserForm
        ref={inviteFormRef}
        onSuccess={handleInviteSuccess}
      />

      {/* 新建/编辑用户表单弹窗 */}
      <UserForm ref={userFormRef} />

      {/* 邀请链接弹窗 */}
      <InvitationLinkModal ref={invitationModalRef} />
    </div>
  );
}

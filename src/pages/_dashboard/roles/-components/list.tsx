import type { ActionItem, ProTableSearchField } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { RoleFormRef } from './RoleForm';
import type { Role, RoleListParams } from '@/api/endpoints/role.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Input,
  message,
  Modal,
  Space,
  Tag,
} from 'antd';
import { useRef, useState } from 'react';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  copyRole,
  deleteRole,
  getRoleList,
} from '@/api/endpoints/role.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { RoleAccessConfigDrawer } from './RoleAccessConfigDrawer';
import { RoleForm } from './RoleForm';
import {
  closeRoleAccessDrawer,
  createClosedRoleAccessDrawerState,
  openRoleAccessDrawer,
  type RoleAccessTabKey,
} from './role-access-drawer.helpers';
import { getRoleRowActionKeys } from './role-row-actions';

/**
 * 角色列表页面
 */
export function RolesListPage() {
  const queryClient = useQueryClient();

  // 表单状态
  const formRef = useRef<RoleFormRef>(null);
  const [drawerState, setDrawerState] = useState(createClosedRoleAccessDrawerState);

  // 获取角色列表
  const table = useProTableQuery<Role, RoleListParams>({
    useQuery,
    queryKey: ['roles'],
    queryFn: params => getRoleList(params).then(res => normalizePaginatedPayload(res, { defaultPageSize: 20 })),
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

  // 删除角色 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      message.success('角色删除成功');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      message.error(`删除失败: ${error.message}`);
    },
  });

  // 复制角色 mutation
  const copyMutation = useMutation({
    mutationFn: ({ id, params }: { id: string; params: { name: string; code: string } }) =>
      copyRole(id, params),
    onSuccess: () => {
      message.success('角色复制成功');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (error: any) => {
      message.error(`复制失败: ${error.message}`);
    },
  });

  // 删除确认
  const handleDelete = (role: Role) => {
    if (role.isSystem) {
      message.warning('系统角色不能删除');
      return;
    }
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色 "${role.name}" 吗？`,
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(role.id),
    });
  };

  // 复制角色
  const handleCopy = (role: Role) => {
    Modal.confirm({
      title: '复制角色',
      content: (
        <div className="mt-4">
          <p className="mb-2">
            将复制角色 "
            {role.name}
            " 的所有配置
          </p>
          <Input
            id="copy-role-name"
            placeholder="新角色名称"
            className="mb-2"
            defaultValue={`${role.name} 副本`}
          />
          <Input
            id="copy-role-code"
            placeholder="新角色编码"
            defaultValue={`${role.code}_copy`}
          />
        </div>
      ),
      okText: '复制',
      cancelText: '取消',
      onOk: () => {
        const nameInput = document.getElementById('copy-role-name') as HTMLInputElement;
        const codeInput = document.getElementById('copy-role-code') as HTMLInputElement;
        if (nameInput?.value && codeInput?.value) {
          copyMutation.mutate({
            id: role.id,
            params: { name: nameInput.value, code: codeInput.value },
          });
        }
        else {
          message.warning('请输入角色名称和编码');
          return Promise.reject(new Error('请输入角色名称和编码'));
        }
      },
    });
  };

  // 打开新建表单
  const handleCreate = () => {
    formRef.current?.open();
  };

  // 打开编辑表单
  const handleEdit = (role: Role) => {
    formRef.current?.open({ data: role });
  };

  const handleAccessConfig = (role: Role) => {
    setDrawerState(openRoleAccessDrawer({
      id: role.id,
      code: role.code,
      name: role.name,
    }));
  };

  const handleCloseDrawer = () => {
    setDrawerState(prev => closeRoleAccessDrawer(prev));
  };

  const handleDrawerTabChange = (tab: RoleAccessTabKey) => {
    setDrawerState(prev => ({
      ...prev,
      activeTab: tab,
    }));
  };

  // 表格列定义
  const columns: ColumnsType<Role> = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, role: Role) => (
        <Space>
          <span className="font-medium">{name}</span>
          {role.isSystem && (
            <Tag color="purple">系统</Tag>
          )}
        </Space>
      ),
    },
    {
      title: '角色编码',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <Tag color="blue">{code}</Tag>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || '-',
    },
    {
      title: '排序',
      dataIndex: 'sort',
      key: 'sort',
      width: 80,
      render: (sort: number) => sort ?? 0,
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 260,
      fixed: 'right',
      render: (_, role: Role) => {
        const actionItems: ActionItem<Role>[] = getRoleRowActionKeys(role.code).map((key) => {
          switch (key) {
            case 'edit':
              return {
                key,
                label: '编辑',
                onClick: () => handleEdit(role),
              };
            case 'access-config':
              return {
                key,
                label: '权限配置',
                onClick: () => handleAccessConfig(role),
              };
            case 'copy':
              return {
                key,
                label: '复制',
                disabled: copyMutation.isPending,
                onClick: () => handleCopy(role),
              };
            case 'delete':
              return {
                key,
                label: '删除',
                danger: true,
                disabled: role.isSystem || deleteMutation.isPending,
                onClick: () => handleDelete(role),
              };
            case 'blocked':
              return {
                key,
                label: '系统超管不允许操作',
                disabled: true,
                onClick: () => void 0,
              };
            default:
              return {
                key: 'blocked',
                label: '系统超管不允许操作',
                disabled: true,
                onClick: () => void 0,
              };
          }
        });

        return (
          <RowActionBar
            items={actionItems}
            context={role}
          />
        );
      },
    },
  ];

  const searchFields: ProTableSearchField<RoleListParams>[] = [
    {
      name: 'q',
      label: '关键词',
      placeholder: '搜索角色名称或编码',
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<Role, RoleListParams>
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
            新建角色
          </Button>
        )}
      />

      {/* 角色表单弹窗 */}
      <RoleForm ref={formRef} />

      <RoleAccessConfigDrawer
        state={drawerState}
        onClose={handleCloseDrawer}
        onTabChange={handleDrawerTabChange}
      />
    </div>
  );
}

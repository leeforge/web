import type { ActionItem } from '@leeforge/react-ui';
import type { ColumnsType } from 'antd/es/table';
import type { APIKey, APIKeyListParams } from '@/api/endpoints/api-key.api';
import { ProTable, RowActionBar, useProTableQuery } from '@leeforge/react-ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Tag } from 'antd';
import { useRef, useState } from 'react';
import { useStore } from 'zustand';
import { normalizePaginatedPayload } from '@/api/adapters/paginated';
import {
  deleteAPIKey,
  disableAPIKey,
  getAPIKeyList,
  rotateAPIKey,
} from '@/api/endpoints/api-key.api';
import CustomIcon from '@/components/CustomIcon/CustomIcon';
import { useMsg } from '@/hooks';
import { AuthStore } from '@/stores';
import { validateTime } from '@/utils';
import { APIKeyForm } from './ApiKeyForm';
import { SecretKeyModal } from './SecretKeyModal';
/**
 * API Keys 列表页面
 */
export function APIKeysListPage() {
  const queryClient = useQueryClient();
  const { msgSuccess, msgError } = useMsg();
  const actingDomain = useStore(AuthStore, state => state.actingDomain);

  // 表单状态
  const formRef = useRef<any>(null);

  // 密钥显示状态
  const [secretKeyModalOpen, setSecretKeyModalOpen] = useState(false);
  const [secretKey, setSecretKey] = useState('');
  const [secretKeyName, setSecretKeyName] = useState('');

  // 获取 API Key 列表
  const table = useProTableQuery({
    useQuery,
    queryKey: ['api-keys', actingDomain?.type || 'platform', actingDomain?.key || 'root'],
    queryFn: (params) => getAPIKeyList(params as APIKeyListParams),
    resultTransform: data => normalizePaginatedPayload<APIKey>(data, {
      defaultPageSize: 20,
    }),
    initialPagination: { pageSize: 20 },
    keepPreviousData: true,
  });

  // 禁用 API Key mutation
  const disableMutation = useMutation({
    mutationFn: disableAPIKey,
    onSuccess: () => {
      msgSuccess('API Key 已禁用');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      msgError(`禁用失败: ${error.message}`);
    },
  });

  // 删除 API Key mutation
  const deleteMutation = useMutation({
    mutationFn: deleteAPIKey,
    onSuccess: () => {
      msgSuccess('API Key 已删除');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    },
    onError: (error: any) => {
      msgError(`删除失败: ${error.message}`);
    },
  });

  // 轮换 API Key mutation
  const rotateMutation = useMutation({
    mutationFn: rotateAPIKey,
    onSuccess: (data) => {
      msgSuccess('API Key 已轮换');
      queryClient.invalidateQueries({ queryKey: ['api-keys'] });
      // 显示新密钥
      setSecretKey(data.data.secretKey);
      setSecretKeyName(data.data.apiKey.name);
      setSecretKeyModalOpen(true);
    },
    onError: (error: any) => {
      msgError(`轮换失败: ${error.message}`);
    },
  });

  // 禁用确认
  const handleDisable = (apiKey: APIKey) => {
    Modal.confirm({
      title: '确认禁用',
      content: (
        <div>
          <p>
            确定要禁用 API Key "
            {apiKey.name}
            " 吗？
          </p>
          <p className="text-textSecondary text-sm mt-2">
            禁用后该密钥将立即失效，使用此密钥的所有应用将无法访问 API。
          </p>
        </div>
      ),
      okText: '确认禁用',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => disableMutation.mutate(apiKey.id),
    });
  };

  // 删除确认
  const handleDelete = (apiKey: APIKey) => {
    Modal.confirm({
      title: '确认删除',
      content: (
        <div>
          <p>
            确定要删除 API Key "
            {apiKey.name}
            " 吗？
          </p>
          <p className="text-textSecondary text-sm mt-2">
            删除后该记录将永久移除，无法恢复。
          </p>
        </div>
      ),
      okText: '确认删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => deleteMutation.mutate(apiKey.id),
    });
  };

  // 轮换确认
  const handleRotate = (apiKey: APIKey) => {
    Modal.confirm({
      title: '确认轮换',
      content: (
        <div>
          <p>
            确定要轮换 API Key "
            {apiKey.name}
            " 吗？
          </p>
          <p className="text-textSecondary text-sm mt-2">
            轮换后将生成新的密钥，旧密钥将立即失效。请确保更新所有使用此密钥的应用。
          </p>
        </div>
      ),
      okText: '确认轮换',
      cancelText: '取消',
      onOk: () => rotateMutation.mutate(apiKey.id),
    });
  };

  // 打开新建表单
  const handleCreate = () => {
    formRef.current?.open();
  };

  // 打开编辑表单
  const handleEdit = (apiKey: APIKey) => {
    formRef.current?.open({ data: apiKey });
  };

  // 关闭表单
  const handleCloseForm = () => {
    // formRef.current?.close();
  };

  // 创建成功后显示密钥
  const handleCreateSuccess = (newSecretKey: string, name: string) => {
    setSecretKey(newSecretKey);
    setSecretKeyName(name);
    setSecretKeyModalOpen(true);
  };

  // 格式化日期
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr)
      return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  // 检查是否过期
  const isExpired = (expiresAt: string | null | undefined) => {
    if (!validateTime(expiresAt))
      return false;
    return new Date(expiresAt as string) < new Date();
  };

  // 表格列定义
  const columns: ColumnsType<APIKey> = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, apiKey: APIKey) => (
        <div>
          <span className="font-medium">{name}</span>
          {apiKey.description && (
            <p className="text-textSecondary text-xs mt-1">
              {apiKey.description}
            </p>
          )}
        </div>
      ),
    },
    {
      title: '密钥',
      dataIndex: 'key',
      key: 'key',
      width: 200,
      render: (key: string) => (
        <code className="bg-bgSecondary px-2 py-1 rounded text-sm font-mono">
          {key}
        </code>
      ),
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, apiKey: APIKey) => {
        const expired = isExpired(apiKey.expiresAt);

        if (!isActive) {
          return <Tag color="default">已禁用</Tag>;
        }
        if (expired) {
          return <Tag color="error">已过期</Tag>;
        }
        return <Tag color="success">有效</Tag>;
      },
    },
    {
      title: '调用次数',
      dataIndex: 'usageCount',
      key: 'usageCount',
      render: (count: number | undefined) => count?.toLocaleString() || '0',
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      width: 200,
      render: (lastUsedAt: string | null | undefined, apiKey: APIKey) => (
        <div>
          <div>{validateTime(lastUsedAt) ? formatDate(lastUsedAt) : '未使用'}</div>
          {apiKey.lastUsedIp && (
            <div className="text-textSecondary text-xs">
              IP:
              {' '}
              {apiKey.lastUsedIp}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (expiresAt: string | null | undefined) => {
        if (!validateTime(expiresAt))
          return <span className="text-textSecondary">永不过期</span>;

        const expired = isExpired(expiresAt);
        return (
          <span className={expired ? 'text-red-500' : ''}>
            {formatDate(expiresAt)}
          </span>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (createdAt: string) => formatDate(createdAt),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 320,
      render: (_, apiKey: APIKey) => {
        const actionItems: ActionItem<APIKey>[] = [
          {
            key: 'edit',
            label: '编辑',
            onClick: () => handleEdit(apiKey),
          },
          {
            key: 'rotate',
            label: '轮换',
            show: apiKey.isActive,
            disabled: rotateMutation.isPending,
            onClick: () => handleRotate(apiKey),
          },
          {
            key: 'disable',
            label: '禁用',
            danger: true,
            disabled: !apiKey.isActive || disableMutation.isPending,
            onClick: () => handleDisable(apiKey),
          },
          {
            key: 'delete',
            label: '删除',
            danger: true,
            disabled: deleteMutation.isPending,
            onClick: () => handleDelete(apiKey),
          },
        ];

        return (
          <RowActionBar
            items={actionItems}
            context={apiKey}
          />
        );
      },
    },
  ];

  return (
    <div className="h-full min-h-0">
      <ProTable<APIKey, APIKeyListParams>
        columns={columns}
        data={table.data}
        loading={table.loading}
        rowKey="id"
        pagination={table.pagination}
        pageSizeOptions={[10, 20, 50, 100]}
        onPaginationChange={table.onPaginationChange}
        onRefresh={table.onRefresh}
        actions={(
          <Button
            type="primary"
            icon={<CustomIcon icon="line-md:plus" width={16} />}
            onClick={handleCreate}
          >
            创建 API Key
          </Button>
        )}
        emptyText={(
          <div className="flex flex-col items-center gap-2 py-8">
            <CustomIcon
              icon="line-md:document"
              width={40}
              className="text-textDisabled"
            />
            <p>暂无 API Key</p>
            <Button type="link" onClick={handleCreate}>
              创建第一个 API Key
            </Button>
          </div>
        )}
      />

      {/* API Key 表单弹窗 */}
      <APIKeyForm
        ref={formRef}
        onClose={handleCloseForm}
        onCreateSuccess={handleCreateSuccess}
      />

      {/* 密钥显示弹窗 */}
      <SecretKeyModal
        open={secretKeyModalOpen}
        secretKey={secretKey}
        keyName={secretKeyName}
        onClose={() => {
          setSecretKeyModalOpen(false);
          setSecretKey('');
          setSecretKeyName('');
        }}
      />
    </div>
  );
}
